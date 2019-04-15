const express = require("express")
const mongoose = require("mongoose")
const moment = require("moment")
const Admin = require("../models/adminModel")
const Employee = require("../models/employeeModel")
const Expense = require("../models/expenseModel")
const { isAdminLoggedIn, isAdminLoggedOut } = require("../middleware/auth.js")
const { check, validationResult } = require("express-validator/check");

const router = express.Router()

const title = {
	adminLogin: "Login | Admin",
	adminDashboard: "Dashboard | Admin",
	adminViewEmployee: "View Employee | Admin"
}

router.get("/login", isAdminLoggedOut, (req, res) => {
	res.render("./admin/login", {
		pageTitle: title.adminLogin,
		email: ""
	})
})

router.post("/login", isAdminLoggedOut, [
		check("email").not().isEmpty().withMessage("Please provide email.").isEmail().withMessage("Invalid email address.").trim().escape(),
		check("password").not().isEmpty().withMessage("Please provide password.").trim().escape()
	], async (req, res) => {
		try {
			let email = req.body.email
			let password = req.body.password

			const errors = validationResult(req)

			if(!errors.isEmpty()){
				return res.render("./admin/login", {
					pageTitle: title.adminLogin,
					errors: errors.array(),
					email
				})
			}
			const admin = await Admin.authenticate(email, password)
			
			if(!admin){
				req.flash("danger", "Incorrect email or password!")
				return res.render("./admin/login", {
					pageTitle: title.adminLogin,
					email: ""
				})
			}

			req.session.admin = admin

			res.redirect("/medapp-expense-admin/dashboard")
		} catch(e) {
			res.status(400).send("Unable to login!\n" + e)
		}
})


router.get("/logout", isAdminLoggedIn, (req, res) => {
	req.session.admin = null
	res.redirect("/medapp-expense-admin/login")
})

router.get("/dashboard", isAdminLoggedIn, async (req, res) => {
	try {
		let monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
		let yearArray = []

		for(let y = moment().year(); y >= 2010; y--)
			yearArray.push(String(y))

		if(["month", "year"].includes(req.query.option)) {

			let viewBy = req.query.option
			let month = Number(req.query.month)
			let year = req.query.year
			let expression = {}

			if(viewBy === "month" && ( month >= 1 && month <= 12) && yearArray.includes(year)) {
				expression = {
					$and: [
						{$eq: [{$year: "$createdAt"}, Number(year)]},
						{$eq: [{$month: "$createdAt"}, month]}
					]
				}
			} else if(viewBy === "year" && yearArray.includes(year)) {
				expression = {
					$eq: [{$year: "$createdAt"}, Number(year)]
				}
			} else {
				req.flash("danger", "Invalid Operation!")
				return res.redirect("/employee/expenses/viewBy")
			}

			const expenses = await Expense.find({ 
				$expr: expression
			}).sort({ createdAt: 1})
			
			res.render("./admin/dashboard", {
				pageTitle: title.adminDashboard,
				viewBy,
				month,
				monthName: monthArray[month - 1],
				year,
				monthArray,
				yearArray,
				expenses
			})			
		} else {
			let month = moment().month() + 1
			let year = moment().year()
			let viewBy = "month"
			let expenses = await Expense.find({
				$expr: {
					$and: [
						{$eq: [{$year: "$createdAt"}, year]},
						{$eq: [{$month: "$createdAt"}, month]}
					]
				}
			}).sort({ createdAt: 1})

			res.render("./admin/dashboard", {
				pageTitle: title.adminDashboard,
				viewBy,
				month,
				monthName: monthArray[month - 1],
				year,
				monthArray,
				yearArray,
				expenses
			})
		}
	} catch(e) {
		res.status(400).send(`<h3>Something went wrong!</h3><p>${e}</p>`)
	}
})

router.get("/expenses", isAdminLoggedIn, async (req, res) => {
	try {
		if(req.query.eid && ["active", "inactive"].includes(req.query.status)) {
			const status = req.query.status == "active" ? true : false
			const expense = await Expense.findOneAndUpdate({ _id: req.query.eid }, { status })
			res.redirect(req.headers.referer)
		} else {
			req.flash("danger", "Invalid operation!")
			return res.redirect("/medapp-expense-admin/dashboard")
		}
	} catch(e) {
		res.status(400).send(`<h3>Something went wrong!</h3><p>${e}</p>`)
	}
})

router.get("/expenses/bill", isAdminLoggedIn, async (req, res) => {
	try {
		if(req.query.eid && req.query.emp) {

			const expense = await Expense.findOne({ _id: req.query.eid, employee: req.query.emp}, "billImage")

			if(!expense) {	
				return res.status(404).send("<h3>404</h3>")
			}

			res.set("Content-Type", "image/png")
			res.send(expense.billImage)
		}else {
			req.flash("danger", "Invalid operation!")
			return res.redirect("/medapp-expense-admin/dashboard")
		}
	} catch(e) {
		res.status(500).send(e)
	}
})

router.get("/employee", isAdminLoggedIn, async (req, res) => {
	try {

		if(req.query.emp) {
			const employee = await Employee.findById(req.query.emp)
			res.render("./admin/viewEmployee", {
				pageTitle: title.adminViewEmployee,
				employee,
				employees: ""
			})
		}else {
			const employees = await Employee.find({})
			res.render("./admin/viewEmployee", {
				pageTitle: title.adminViewEmployee,
				employees,
				employee: ""
			})
		}

	} catch(e) {
		res.status(400).send(`<h3>Something went wrong!</h3><p>${e}</p>`)
	}
})

router.get("/employee/avatar", isAdminLoggedIn, async (req, res) => {
	try {
		const employee = await Employee.findOne({ _id: req.query.emp}, "avatar")
		res.set("Content-Type", "image/png")
		res.send(employee.avatar)
	} catch(e) {
		res.sendStatus(500)
	}
})

module.exports = router