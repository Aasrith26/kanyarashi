import AWS from 'aws-sdk'

export async function uploadToS3(file: File, type: "resume" | "jd") {
     try{
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY_ID,
            region: 'ap-south-1'
        });
        const fileName = `${Date.now()}-${file.name}`
        const key = `${type}/${fileName}`.replace(' ','-')

        const s3 = new AWS.S3({
            params:{
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
                Key: key,
                Body: file
            }
        })
        const params= {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key : key,
            Body :file
        }
        const upload = s3.putObject(params).on('httpUploadProgress',evt => {
            console.log('uploading to s3....',parseInt(((evt.loaded*100)/evt.total).toString()))
        }).promise()

        await upload.then(data => {
            console.log("Uploaded Sucessfully to S3! ",key)
        })

        return Promise.resolve({
            key,
            file_name : file.name
        });       
     }
     catch(error) {
        console.log(error)
     }  
}
export function getS3Url(key : string){
    const url = 'https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${key}';
    return url;
}