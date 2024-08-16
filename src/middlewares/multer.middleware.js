import multer from "multer";



const storage = multer.diskStorage({
    //file is given by multer
    destination: function (req, file, cb) {
      cb(null, "./profile/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) //operation is for very tiny amt of time on server,thori der mai cloudinary se usko upload krdnge fr delete krdnge
    }
  })
  
  export const upload = multer({ 
    storage: storage 
})