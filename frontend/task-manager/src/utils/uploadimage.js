import {API_PATHS} from './apiPaths';
import axiosInstance from './axiosinstance';

const uploadImage = async (imageFile) =>{
    const formData = new FormData();
    formData.append('image',imageFile);

    try{
        const responce = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, formData,{
            headers:{
                'Content-Type':'multipart/form-data',
            },
        });
        return responce.data;
    }catch (error){
        console.error('error uploading the image:',error);
        throw error;
    }
};

export default uploadImage;