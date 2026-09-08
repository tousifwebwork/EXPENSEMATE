 const Expense = require("../../model/expenseModel");
const Group = require("../../model/groupModel");
const cloudinary = require("../../config/cloudinary");
const getGroupMembership = require("../../utils/getGroupMembership");
const createNotification = require("../../utils/createNotification");

const {
  calculateEqualSplit,
  validateExactSplit,
  calculatePercentageSplit,
} = require("../../utils/calculateSplit");

const uploadReceipt = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "expense-receipts" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });

// =========================
// CREATE EXPENSE
// =========================

exports.createExpense = async (req, res) => {
  try {
    const userId = req.user.userId;

    const receiptPhoto = req.file
      ? await uploadReceipt(req.file.buffer)
      : "";

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

    // Default shares
    if (!Array.isArray(shares)) {
      shares = [];
    }

    // =========================
    // REQUIRED FIELDS
    // =========================

    if (
      !groupId ||
      !title ||
      !amount ||
      !paidBy ||
      !splitType
    ) {
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

    // =========================
    // GROUP + MEMBERSHIP
    // =========================

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const requester = getGroupMembership(
      group,
      userId
    );

    if (!requester) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this group",
      });
    }

    // =========================
    // GROUP MEMBER IDS
    // =========================

    const memberIds = group.members.map((member) =>
      member.user.toString()
    );

    // Validate payer
    if (!memberIds.includes(paidBy)) {
      return res.status(400).json({
        success: false,
        message: "Payer must be a group member",
      });
    }

    // Validate participants
    if (splitType !== "fullPayment" && splitType !== "none") {
      const invalidParticipant = shares.find(
        (share) =>
          !share.user ||
          !memberIds.includes(
            share.user.toString()
          )
      );

      if (invalidParticipant) {
        return res.status(400).json({
          success: false,
          message:
            "All participants must be group members",
        });
      }
    }

    // =========================
    // CALCULATE SPLIT
    // =========================

    let finalShares;

    if (splitType === "equal") {
      const participantIds = shares.map(
        (share) => share.user
      );

      if (participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one participant",
        });
      }

      finalShares = calculateEqualSplit(
        Number(amount),
        participantIds
      );
    }

    // =========================
    // EXACT
    // =========================

    else if (splitType === "exact") {
      if (shares.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one participant",
        });
      }

      const isValid = validateExactSplit(
        Number(amount),
        shares
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message:
            "Exact split amounts must add up to the total",
        });
      }

      finalShares = shares.map((share) => ({
        user: share.user,
        amount: Number(share.amount),
      }));
    }

    // =========================
    // PERCENTAGE
    // =========================

    else if (splitType === "percentage") {
      if (shares.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one participant",
        });
      }

      finalShares = calculatePercentageSplit(
        Number(amount),
        shares
      );

      if (!finalShares) {
        return res.status(400).json({
          success: false,
          message:
            "Percentages must add up to 100",
        });
      }
    }

    // =========================
    // FULL PAYMENT
    // =========================

    else if (splitType === "fullPayment") {
      finalShares = [];
    }

    // PERSONAL CONTRIBUTION
    else if (splitType === "none") {
      finalShares = [];
    }

    // =========================
    // INVALID SPLIT
    // =========================

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid split type",
      });
    }

    // =========================
    // SAVE EXPENSE
    // =========================

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

      // IMPORTANT:
      // Schema field is receiptUrl
      receiptUrl: receiptPhoto,

      notes: "",
    });

    const notifyUserIds = finalShares
  .map((s) => s.user.toString())
  .filter((id) => id !== userId); // don't notify yourself

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
    console.log(
      "CREATE EXPENSE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// GET ALL EXPENSES FOR GROUP
// =========================

exports.getGroupExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { groupId } = req.params;
    const {
      search,       // text search on title/description/notes
      category,
      payer,
      participant,
      splitType,
      startDate,
      endDate,
      sortBy,       // "amount" | "date" | "category" | "updatedAt"
      sortOrder,    // "asc" | "desc"
    } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    // ---- BUILD DYNAMIC QUERY ----
    const query = { group: groupId };

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
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // ---- BUILD SORT ----
    const sortField = ["amount", "date", "category", "updatedAt"].includes(sortBy) ? sortBy : "date";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const expenses = await Expense.find(query)
      .populate("paidBy", "name profileImage")
      .populate("shares.user", "name profileImage")
      .sort({ [sortField]: sortDirection });

    res.status(200).json({ success: true, expenses, count: expenses.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET SINGLE EXPENSE
// =========================

exports.getExpenseById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(
      expenseId
    )
      .populate(
        "paidBy",
        "name profileImage"
      )
      .populate(
        "shares.user",
        "name profileImage"
      );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(
      expense.group
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!getGroupMembership(group, userId)) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this group",
      });
    }

    return res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.log(
      "GET EXPENSE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// UPDATE EXPENSE
// =========================

exports.updateExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const receiptPhoto = req.file
      ? await uploadReceipt(req.file.buffer)
      : undefined;

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

    // =========================
    // PARSE SHARES
    // =========================

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

    const expense = await Expense.findById(
      expenseId
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(
      expense.group
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // =========================
    // MEMBERSHIP
    // =========================

    const requester = getGroupMembership(
      group,
      userId
    );

    if (!requester) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this group",
      });
    }

    // =========================
    // PERMISSION
    // =========================

    const isOwnExpense =
      expense.createdBy.toString() === userId;

    const isPrivileged =
      requester.role === "owner" ||
      requester.role === "admin";

    if (!isOwnExpense && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized to edit this expense",
      });
    }

    // =========================
    // AMOUNT VALIDATION
    // =========================

    if (
      amount !== undefined &&
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be greater than zero",
      });
    }

    // =========================
    // MEMBER IDS
    // =========================

    const memberIds = group.members.map(
      (member) =>
        member.user.toString()
    );

    // Validate payer
    if (
      paidBy !== undefined &&
      !memberIds.includes(paidBy)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payer must be a group member",
      });
    }

    // =========================
    // SPLIT UPDATE
    // =========================

    if (
      amount !== undefined ||
      splitType !== undefined ||
      shares !== undefined
    ) {
      const finalAmount =
        amount !== undefined
          ? Number(amount)
          : expense.amount;

      const finalSplitType =
        splitType !== undefined
          ? splitType
          : expense.splitType;

      let finalRawShares =
        shares !== undefined
          ? shares
          : expense.shares;

      if (!Array.isArray(finalRawShares)) {
        return res.status(400).json({
          success: false,
          message: "Shares must be an array",
        });
      }

      // =========================
      // VALIDATE PARTICIPANTS
      // =========================

      if (finalSplitType !== "fullPayment" && finalSplitType !== "none") {
        const invalidParticipant =
          finalRawShares.find(
            (share) =>
              !share.user ||
              !memberIds.includes(
                share.user.toString()
              )
          );

        if (invalidParticipant) {
          return res.status(400).json({
            success: false,
            message:
              "All participants must be group members",
          });
        }
      }

      let finalShares;

      // =========================
      // EQUAL
      // =========================

      if (finalSplitType === "equal") {
        const participantIds =
          finalRawShares.map(
            (share) => share.user
          );

        if (participantIds.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Select at least one participant",
          });
        }

        finalShares =
          calculateEqualSplit(
            finalAmount,
            participantIds
          );
      }

      // =========================
      // EXACT
      // =========================

      else if (finalSplitType === "exact") {
        if (finalRawShares.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Select at least one participant",
          });
        }

        const isValid =
          validateExactSplit(
            finalAmount,
            finalRawShares
          );

        if (!isValid) {
          return res.status(400).json({
            success: false,
            message:
              "Exact split amounts must add up to the total",
          });
        }

        finalShares =
          finalRawShares.map((share) => ({
            user: share.user,
            amount: Number(
              share.amount
            ),
          }));
      }

      // =========================
      // PERCENTAGE
      // =========================

      else if (
        finalSplitType === "percentage"
      ) {
        if (finalRawShares.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Select at least one participant",
          });
        }

        finalShares =
          calculatePercentageSplit(
            finalAmount,
            finalRawShares
          );

        if (!finalShares) {
          return res.status(400).json({
            success: false,
            message:
              "Percentages must add up to 100",
          });
        }
      }

      // =========================
      // FULL PAYMENT
      // =========================

      else if (
        finalSplitType === "fullPayment"
      ) {
        finalShares = [];
      }

      else if (finalSplitType === "none") {
        finalShares = [];
      }

      // =========================
      // INVALID SPLIT
      // =========================

      else {
        return res.status(400).json({
          success: false,
          message: "Invalid split type",
        });
      }

      expense.amount = finalAmount;
      expense.splitType = finalSplitType;
      expense.shares = finalShares;
    }

    // =========================
    // SIMPLE FIELDS
    // =========================

    if (title !== undefined) {
      expense.title = title;
    }

    if (description !== undefined) {
      expense.description =
        description;
    }

    if (category !== undefined) {
      expense.category = category;
    }

    if (date !== undefined) {
      expense.date = date;
    }

    if (paidBy !== undefined) {
      expense.paidBy = paidBy;
    }

    if (notes !== undefined) {
      expense.notes = notes;
    }

    // =========================
    // UPDATE RECEIPT
    // =========================

    // IMPORTANT:
    // Schema uses receiptUrl.
    // Only replace it if a new image
    // was uploaded.
    if (receiptPhoto !== undefined) {
      expense.receiptUrl = receiptPhoto;
    }

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Expense updated",
      expense,
    });
  } catch (error) {
    console.log(
      "UPDATE EXPENSE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// DELETE EXPENSE
// =========================

exports.deleteExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    const expense = await Expense.findById(
      expenseId
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(
      expense.group
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const requester =
      getGroupMembership(group, userId);

    if (!requester) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this group",
      });
    }

    const isOwnExpense =
      expense.createdBy.toString() === userId;

    const isPrivileged =
      requester.role === "owner" ||
      requester.role === "admin";

    if (!isOwnExpense && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized to delete this expense",
      });
    }

    await expense.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Expense deleted",
    });
  } catch (error) {
    console.log(
      "DELETE EXPENSE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 


// delete recipt
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
    if (expense.receiptUrl) {
      expense.receiptUrl = null;
      await expense.save();
    }
    return res.status(200).json({success: true, message: "Receipt deleted",});
  }catch (error) {
    console.log( "DELETE RECEIPT ERROR:",error )
  }
}