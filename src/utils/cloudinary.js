import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";// file system in node js which we donts need to install




    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
    });



    const uploadOnCloudinary=async (localFilePath)=>{
        try {

            if(!localFilePath) return null
            //upload file on cloudinary
            const response=await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            //file has been uploaded successfully
            //console.log("file is uploaded on cloudinary",response.url);
            fs.unlinkSync(localFilePath) //
            return response;

        } catch (error) {
            fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
            return null;
        }

    }
    const deleteOnCloudinary = async(public_id, resource_type="auto")=>{
        try {
            if(!public_id){
                return null;
            }
            const result = await cloudinary.uploader.destroy(public_id,{
                resource_type:`${resource_type}`
            });
        } catch (error) {
            return error;
            console.log("deletion failed",error)
        }
    }



    

    export {uploadOnCloudinary,deleteOnCloudinary}



 //strategy of cloudinary

// sbse phle user se file upload krwnge multer k through
//Multer k through he file upload hoti hai,direct cloudinary nhi hota hai
// cloudnary is just a service like SDK,
//cloudinary aws will take file from us and upload to its server
//hm multer ka use krte hue ush file ko user se lkr temporarily apne local server pr rkhdnge
//next step is
//cloudinary ka use krte hue vo local storage se file lnge or usko server pr daal dnge
