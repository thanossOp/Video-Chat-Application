const loadindex = async(req,res)=>{
    try {
        res.render('index')
    } catch (error) {
        console.log('error',error)
    }
}

module.exports = {
    loadindex
}