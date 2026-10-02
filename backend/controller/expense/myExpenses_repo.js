
const Expense = require("../../model/expenseModel");
const Group = require("../../model/groupModel");


exports.myExpense_details = async (req, res) => {
  try { 
    const userId = req.user.userId; 

    const groups = await Group.find({"members.user": userId}).select("_id");
    const groupIds = groups.map(group => group._id);
    const expenses = await Expense.find({group: { $in: groupIds }}).populate("group", "name")

    res.status(200).json(expenses);

  } catch (err) { 
    res.status(500).json({message: err.message });
  }
};