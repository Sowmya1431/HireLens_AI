const pdfParse = require("pdf-parse");
const extractPDFText=async(buffer)=>{
    try{
        const data=await pdfParse(buffer);
        return data.text;

    }
    catch(error){
        console.log("REAL PDF ERROR:", error);
        throw new Error("PDF parsing failed");
    }
};
module.exports=extractPDFText;


