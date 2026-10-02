const Expense = require("../../model/expenseModel");
const Group = require("../../model/groupModel");
const cloudinary = require("../../config/cloudinary");

const getGroupMembership = require("../../utils/getGroupMembership");
const createNotification = require("../../utils/createNotification");
const logActivity = require("../../utils/logActivity");

const {
  calculateEqualSplit,
  validateExactSplit,
  calculatePercentageSplit,
} = require("../../utils/calculateSplit");

// ========================================
// CLOUDINARY RECEIPT UPLOAD
// ========================================

const uploadReceipt = (buffer) =>
  new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return reject(new Error("Receipt file is empty or invalid"));
    }

    console.log("CLOUDINARY RECEIPT UPLOAD:", {
      isBuffer: Buffer.isBuffer(buffer),
      bufferLength: buffer.length,
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "expense-receipts",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("CLOUDINARY RECEIPT ERROR:", error);
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(
            new Error("Cloudinary did not return a receipt URL")
          );
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.on("error", (error) => {
      console.error("CLOUDINARY STREAM ERROR:", error);
      reject(error);
    });

    uploadStream.end(buffer);
  });

// ========================================
// CREATE EXPENSE
// ========================================

exports.createExpense = async (req, res) => {
  try {
    const userId = req.user.userId;

    let receiptPhoto = "";

    if (req.file) {
      console.log("CREATE RECEIPT FILE CHECK:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferIsBuffer: Buffer.isBuffer(req.file.buffer),
        bufferLength: req.file.buffer?.length,
      });

      if (
        !Buffer.isBuffer(req.file.buffer) ||
        req.file.buffer.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Receipt file is empty or invalid.",
        });
      }

      receiptPhoto = await uploadReceipt(req.file.buffer);
    }

    let {
      groupId,
      title,
      description,
      amount,
      currency,
      category,
      date,
      paidBy,
      splitType,
      shares,
    } = req.body;

    // FormData sends shares as a JSON string
    if (typeof shares === "string") {
      try {
        shares = JSON.parse(shares);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid shares data",
        });
      }
    }

    if (!Array.isArray(shares)) {
      shares = [];
    }

    // REQUIRED FIELDS
    if (!groupId || !title || !amount || !paidBy || !splitType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    // GROUP + MEMBERSHIP
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const requester = getGroupMembership(group, userId);

    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const memberIds = group.members.map((member) =>
      member.user.toString()
    );

    if (!memberIds.includes(paidBy)) {
      return res.status(400).json({
        success: false,
        message: "Payer must be a group member",
      });
    }

    if (splitType !== "fullPayment" && splitType !== "none") {
      const invalidParticipant = shares.find(
        (share) =>
          !share.user ||
          !memberIds.includes(share.user.toString())
      );

      if (invalidParticipant) {
        return res.status(400).json({
          success: false,
          message: "All participants must be group members",
        });
      }
    }

    // CALCULATE SPLIT
    let finalShares;

    if (splitType === "equal") {
      const participantIds = shares.map((share) => share.user);

      if (participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Select at least one participant",
        });
      }

      finalShares = calculateEqualSplit(
        Number(amount),
        participantIds
      );
    } else if (splitType === "exact") {
      if (shares.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Select at least one participant",
        });
      }

      const isValid = validateExactSplit(Number(amount), shares);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Exact split amounts must add up to the total",
        });
      }

      finalShares = shares.map((share) => ({
        user: share.user,
        amount: Number(share.amount),
      }));
    } else if (splitType === "percentage") {
      if (shares.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Select at least one participant",
        });
      }

      finalShares = calculatePercentageSplit(
        Number(amount),
        shares
      );

      if (!finalShares) {
        return res.status(400).json({
          success: false,
          message: "Percentages must add up to 100",
        });
      }
    } else if (splitType === "fullPayment") {
      finalShares = [];
    } else if (splitType === "none") {
      finalShares = [];
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid split type",
      });
    }

    // SAVE EXPENSE
    const expense = await Expense.create({
      group: groupId,
      title,
      description,
      amount: Number(amount),
      currency: currency || group.baseCurrency,
      category,
      date,
      paidBy,
      splitType,
      shares: finalShares,
      createdBy: userId,
      receiptUrl: receiptPhoto,
      notes: "",
    });

    // ACTIVITY LOG
    await logActivity({
      group: groupId,
      actor: userId,
      action: "expense_added",
      description: `added expense "${title}" (${currency || group.baseCurrency} ${amount})`,
    });

    // NOTIFICATIONS
    const notifyUserIds = finalShares
      .map((share) => share.user.toString())
      .filter((id) => id !== userId);

    for (const recipientId of notifyUserIds) {
      await createNotification({
        recipient: recipientId,
        type: "expense_added",
        message: `${title} (${currency || group.baseCurrency} ${amount}) was added in "${group.name}"`,
        relatedGroup: groupId,
        relatedUser: userId,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Expense added",
      expense,
    });
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET ALL EXPENSES FOR GROUP
// ========================================

exports.getGroupExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;

    const {
      search,
      category,
      payer,
      participant,
      splitType,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const query = {
      group: groupId,
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    if (category) query.category = category;
    if (payer) query.paidBy = payer;
    if (participant) query["shares.user"] = participant;
    if (splitType) query.splitType = splitType;

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(startDate);
      }

      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const sortField = [
      "amount",
      "date",
      "category",
      "updatedAt",
    ].includes(sortBy)
      ? sortBy
      : "date";

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const expenses = await Expense.find(query)
      .populate("paidBy", "name profileImage")
      .populate("shares.user", "name profileImage")
      .sort({
        [sortField]: sortDirection,
      });

    return res.status(200).json({
      success: true,
      expenses,
      count: expenses.length,
    });
  } catch (error) {
    console.error("GET GROUP EXPENSES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET SINGLE EXPENSE
// ========================================

exports.getExpenseById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("paidBy", "name profileImage")
      .populate("shares.user", "name profileImage");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(expense.group);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    return res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("GET EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// UPDATE EXPENSE
// ========================================

exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    let receiptPhoto;

    // RECEIPT VALIDATION AND UPLOAD
    if (req.file) {
      console.log("UPDATE RECEIPT FILE CHECK:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferIsBuffer: Buffer.isBuffer(req.file.buffer),
        bufferLength: req.file.buffer?.length,
      });

      if (
        !Buffer.isBuffer(req.file.buffer) ||
        req.file.buffer.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Receipt file is empty or missing from the request.",
        });
      }

      receiptPhoto = await uploadReceipt(req.file.buffer);
    }

    let {
      title,
      description,
      amount,
      category,
      date,
      paidBy,
      splitType,
      shares,
      notes,
    } = req.body;

    if (typeof shares === "string") {
      try {
        shares = JSON.parse(shares);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid shares data",
        });
      }
    }

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(expense.group);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const requester = getGroupMembership(group, userId);

    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const isOwnExpense =
      expense.createdBy.toString() === userId;

    const isPrivileged =
      requester.role === "owner" || requester.role === "admin";

    if (!isOwnExpense && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this expense",
      });
    }

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const memberIds = group.members.map((member) =>
      member.user.toString()
    );

    if (paidBy !== undefined && !memberIds.includes(paidBy)) {
      return res.status(400).json({
        success: false,
        message: "Payer must be a group member",
      });
    }

    const oldAmount = expense.amount;
    const oldTitle = expense.title;

    // SPLIT UPDATE
    if (
      amount !== undefined ||
      splitType !== undefined ||
      shares !== undefined
    ) {
      const finalAmount =
        amount !== undefined ? Number(amount) : expense.amount;

      const finalSplitType =
        splitType !== undefined ? splitType : expense.splitType;

      const finalRawShares =
        shares !== undefined ? shares : expense.shares;

      if (!Array.isArray(finalRawShares)) {
        return res.status(400).json({
          success: false,
          message: "Shares must be an array",
        });
      }

      if (
        finalSplitType !== "fullPayment" &&
        finalSplitType !== "none"
      ) {
        const invalidParticipant = finalRawShares.find(
          (share) =>
            !share.user ||
            !memberIds.includes(share.user.toString())
        );

        if (invalidParticipant) {
          return res.status(400).json({
            success: false,
            message: "All participants must be group members",
          });
        }
      }

      let finalShares;

      if (finalSplitType === "equal") {
        const participantIds = finalRawShares.map(
          (share) => share.user
        );

        if (participantIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Select at least one participant",
          });
        }

        finalShares = calculateEqualSplit(
          finalAmount,
          participantIds
        );
      } else if (finalSplitType === "exact") {
        if (finalRawShares.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Select at least one participant",
          });
        }

        const isValid = validateExactSplit(
          finalAmount,
          finalRawShares
        );

        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: "Exact split amounts must add up to the total",
          });
        }

        finalShares = finalRawShares.map((share) => ({
          user: share.user,
          amount: Number(share.amount),
        }));
      } else if (finalSplitType === "percentage") {
        if (finalRawShares.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Select at least one participant",
          });
        }

        finalShares = calculatePercentageSplit(
          finalAmount,
          finalRawShares
        );

        if (!finalShares) {
          return res.status(400).json({
            success: false,
            message: "Percentages must add up to 100",
          });
        }
      } else if (
        finalSplitType === "fullPayment" ||
        finalSplitType === "none"
      ) {
        finalShares = [];
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid split type",
        });
      }

      expense.amount = finalAmount;
      expense.splitType = finalSplitType;
      expense.shares = finalShares;
    }

    // SIMPLE FIELDS
    if (title !== undefined) expense.title = title;
    if (description !== undefined) expense.description = description;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (paidBy !== undefined) expense.paidBy = paidBy;
    if (notes !== undefined) expense.notes = notes;

    // Only replace receipt if a new one was uploaded
    if (receiptPhoto !== undefined) {
      expense.receiptUrl = receiptPhoto;
    }

    await expense.save();

    await logActivity({
      group: expense.group,
      actor: userId,
      action: "expense_updated",
      description: `updated expense "${expense.title}"`,
      metadata: {
        oldAmount,
        newAmount: expense.amount,
        oldTitle,
        newTitle: expense.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Expense updated",
      expense,
    });
  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// DELETE EXPENSE
// ========================================

exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(expense.group);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const requester = getGroupMembership(group, userId);

    if (!requester) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    const isOwnExpense =
      expense.createdBy.toString() === userId;

    const isPrivileged =
      requester.role === "owner" || requester.role === "admin";

    if (!isOwnExpense && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this expense",
      });
    }

    await logActivity({
      group: expense.group,
      actor: userId,
      action: "expense_deleted",
      description: `deleted expense "${expense.title}" (${expense.currency} ${expense.amount})`,
    });

    await expense.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Expense deleted",
    });
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// DELETE RECEIPT PHOTO
// ========================================

exports.deleteReceiptPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(expense.group);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    expense.receiptUrl = null;
    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Receipt deleted",
    });
  } catch (error) {
    console.error("DELETE RECEIPT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};