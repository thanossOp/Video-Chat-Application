const express = require('express')
const router = express()

const userController = require('../controller/usercontroller')

router.get('/',userController.loadindex)

module.exports = router