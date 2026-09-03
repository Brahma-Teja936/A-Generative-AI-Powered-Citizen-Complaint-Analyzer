
// // import { useState } from "react";


// // import API from "../services/api";

// // function ComplaintForm() {

// //   // =====================================================
// //   // TEXT COMPLAINT STATES
// //   // =====================================================

// //   const [complaint, setComplaint] = useState("");
// //   const [textResult, setTextResult] = useState(null);
// //   const [textLoading, setTextLoading] = useState(false);

// //   // =====================================================
// //   // IMAGE COMPLAINT STATES
// //   // =====================================================

// //   const [selectedImage, setSelectedImage] = useState(null);
// //   const [imagePreview, setImagePreview] = useState(null);
// //   const [imageResult, setImageResult] = useState(null);
// //   const [imageLoading, setImageLoading] = useState(false);


// //   // =====================================================
// //   // TEXT COMPLAINT
// //   // =====================================================

// //   const submitComplaint = async () => {

// //     if (complaint.trim() === "") {
// //       alert("Please enter a complaint.");
// //       return;
// //     }

// //     try {

// //       setTextLoading(true);
// //       setTextResult(null);

// //       const response = await API.post("/predict", {
// //         complaint: complaint
// //       });

// //       setTextResult(response.data);

// //     } catch (error) {

// //       console.log(error);

// //       if (error.response) {
// //         alert(
// //           error.response.data?.error ||
// //           "Backend returned an error."
// //         );
// //       } else {
// //         alert("Unable to connect to backend.");
// //       }

// //     } finally {

// //       setTextLoading(false);

// //     }
// //   };


// //   // =====================================================
// //   // IMAGE SELECTION
// //   // =====================================================

// //   const handleImageChange = (event) => {

// //     const file = event.target.files[0];

// //     if (!file) {
// //       return;
// //     }

// //     // Check file type

// //     if (!file.type.startsWith("image/")) {

// //       alert("Please select a valid image.");

// //       return;
// //     }

// //     setSelectedImage(file);

// //     // Create image preview

// //     const previewUrl = URL.createObjectURL(file);

// //     setImagePreview(previewUrl);

// //     // Clear previous result

// //     setImageResult(null);
// //   };


// //   // =====================================================
// //   // IMAGE ANALYSIS
// //   // =====================================================

// //   const analyzeImage = async () => {

// //     if (!selectedImage) {

// //       alert("Please select an image first.");

// //       return;
// //     }

// //     try {

// //       setImageLoading(true);
// //       setImageResult(null);

// //       // FormData is required for image upload

// //       const formData = new FormData();

// //       formData.append("image", selectedImage);

// //       console.log("Uploading image...");

// //       const response = await API.post(
// //         "/predict-image",
// //         formData
// //       );

// //       console.log("Image analysis result:");
// //       console.log(response.data);

// //       setImageResult(response.data);

// //     } catch (error) {

// //       console.log("IMAGE ERROR:", error);

// //       if (error.response) {

// //         alert(
// //           error.response.data?.error ||
// //           error.response.data?.message ||
// //           "Image analysis failed."
// //         );

// //       } else {

// //         alert(
// //           "Unable to connect to backend. Make sure Flask is running."
// //         );

// //       }

// //     } finally {

// //       setImageLoading(false);

// //     }
// //   };


// //   // =====================================================
// //   // UI
// //   // =====================================================

// //   return (

// //     <div
// //       style={{
// //         maxWidth: "900px",
// //         margin: "30px auto",
// //         fontFamily: "Arial",
// //         padding: "20px"
// //       }}
// //     >

// //       <h1 style={{ textAlign: "center" }}>
// //         Generative AI Complaint Analyzer
// //       </h1>


// //       {/* =================================================
// //           TEXT COMPLAINT SECTION
// //       ================================================= */}

// //       <h2>📝 Text Complaint</h2>

// //       <textarea
// //         rows="5"
// //         style={{
// //           width: "100%",
// //           fontSize: "16px",
// //           padding: "10px",
// //           boxSizing: "border-box"
// //         }}
// //         placeholder="Enter your complaint..."
// //         value={complaint}
// //         onChange={(e) => setComplaint(e.target.value)}
// //       />

// //       <br />
// //       <br />

// //       <button
// //         onClick={submitComplaint}
// //         disabled={textLoading}
// //         style={{
// //           padding: "12px 25px",
// //           fontSize: "16px",
// //           cursor: textLoading ? "not-allowed" : "pointer"
// //         }}
// //       >
// //         {textLoading ? "Analyzing..." : "Submit Complaint"}
// //       </button>


// //       {/* =================================================
// //           TEXT RESULT
// //       ================================================= */}

// //       {textResult && (

// //         <div style={{ marginTop: "40px" }}>

// //           <hr />

// //           <h2>Text Complaint Prediction</h2>

// //           <table
// //             border="1"
// //             cellPadding="10"
// //             style={{
// //               borderCollapse: "collapse",
// //               width: "100%"
// //             }}
// //           >

// //             <tbody>

// //               <tr>
// //                 <td><b>Category</b></td>
// //                 <td>{textResult.prediction.Category}</td>
// //               </tr>

// //               <tr>
// //                 <td><b>Department</b></td>
// //                 <td>{textResult.prediction.Department}</td>
// //               </tr>

// //               <tr>
// //                 <td><b>Priority</b></td>
// //                 <td>{textResult.prediction.Priority}</td>
// //               </tr>

// //               <tr>
// //                 <td><b>Severity</b></td>
// //                 <td>{textResult.prediction.Severity}</td>
// //               </tr>

// //               <tr>
// //                 <td><b>Sentiment</b></td>
// //                 <td>{textResult.prediction.Sentiment}</td>
// //               </tr>

// //             </tbody>

// //           </table>

// //           <br />

// //           <h2>AI Summary</h2>

// //           <p>
// //             {textResult.ai_response.summary}
// //           </p>

// //           <hr />

// //           <h2>Recommended Action</h2>

// //           <p>
// //             {textResult.ai_response.recommended_action}
// //           </p>

// //           <hr />

// //           <h2>Citizen Response</h2>

// //           <p>
// //             {textResult.ai_response.citizen_response}
// //           </p>

// //         </div>

// //       )}


// //       {/* =================================================
// //           IMAGE COMPLAINT SECTION
// //       ================================================= */}

// //       <hr style={{ margin: "50px 0" }} />

// //       <h2>🖼️ Image Complaint</h2>

// //       <p>
// //         Upload an image of the civic problem.
// //       </p>


// //       {/* IMAGE INPUT */}

// //       <input
// //         type="file"
// //         accept="image/*"
// //         onChange={handleImageChange}
// //       />


// //       {/* IMAGE PREVIEW */}

// //       {imagePreview && (

// //         <div style={{ marginTop: "20px" }}>

// //           <h3>Selected Image</h3>

// //           <img
// //             src={imagePreview}
// //             alt="Selected complaint"
// //             style={{
// //               maxWidth: "100%",
// //               maxHeight: "400px",
// //               border: "1px solid #ccc",
// //               padding: "5px"
// //             }}
// //           />

// //         </div>

// //       )}


// //       <br />


// //       {/* ANALYZE BUTTON */}

// //       <button
// //         onClick={analyzeImage}
// //         disabled={imageLoading || !selectedImage}
// //         style={{
// //           padding: "12px 25px",
// //           fontSize: "16px",
// //           cursor:
// //             imageLoading || !selectedImage
// //               ? "not-allowed"
// //               : "pointer"
// //         }}
// //       >
// //         {imageLoading
// //           ? "Analyzing Image..."
// //           : "Analyze Image"}
// //       </button>


// //       {/* =================================================
// //           IMAGE RESULT
// //       ================================================= */}

// //       {imageResult && (

// //         <div style={{ marginTop: "40px" }}>

// //           <hr />

// //           <h2>🔍 Complete AI Image Analysis</h2>


// //           <table
// //             border="1"
// //             cellPadding="10"
// //             style={{
// //               borderCollapse: "collapse",
// //               width: "100%"
// //             }}
// //           >

// //             <tbody>

// //               <tr>
// //                 <td><b>Category</b></td>
// //                 <td>{imageResult.category}</td>
// //               </tr>

// //               <tr>
// //                 <td><b>Department</b></td>
// //                 <td>{imageResult.department}</td>
// //               </tr>

// //               <tr>
// //                 <td><b>Confidence</b></td>
// //                 <td>
// //                   {(imageResult.confidence * 100).toFixed(2)}%
// //                 </td>
// //               </tr>

// //             </tbody>

// //           </table>


// //           {/* IMAGE DESCRIPTION */}

// //           <h3>Image Description</h3>

// //           <p>
// //             {imageResult.image_description}
// //           </p>


// //           {/* GROQ AI ANALYSIS */}

// //           {imageResult.ai_analysis && (

// //             <div>

// //               <hr />

// //               <h2>🤖 AI Analysis</h2>


// //               <h3>Problem</h3>

// //               <p>
// //                 {imageResult.ai_analysis.problem}
// //               </p>


// //               <h3>Priority</h3>

// //               <p>
// //                 {imageResult.ai_analysis.priority}
// //               </p>


// //               <h3>Severity</h3>

// //               <p>
// //                 {imageResult.ai_analysis.severity}
// //               </p>
// //               <h3>Sentiment</h3>

// //               <p>
// //                 {imageResult.ai_analysis.sentiment}
// //               </p>


// //               <h3>Summary</h3>

// //               <p>
// //                 {imageResult.ai_analysis.summary}
// //               </p>


// //               <h3>Recommended Action</h3>

// //               <p>
// //                 {imageResult.ai_analysis.recommended_action}
// //               </p>


// //               <h3>Citizen Response</h3>

// //               <p>
// //                 {imageResult.ai_analysis.citizen_response}
// //               </p>

// //             </div>

// //           )}

// //         </div>

// //       )}

// //     </div>

// //   );
// // }

// // export default ComplaintForm;
// import { useState } from "react";
// import API from "../services/api";

// function ComplaintForm() {

//   // =====================================================
//   // TEXT COMPLAINT
//   // =====================================================

//   const [complaint, setComplaint] = useState("");
//   const [textResult, setTextResult] = useState(null);
//   const [textLoading, setTextLoading] = useState(false);

//   // =====================================================
//   // IMAGE COMPLAINT
//   // =====================================================

//   const [selectedImage, setSelectedImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [imageResult, setImageResult] = useState(null);
//   const [imageLoading, setImageLoading] = useState(false);


//   // =====================================================
//   // TEXT ANALYSIS
//   // =====================================================

//   const submitComplaint = async () => {

//     if (complaint.trim() === "") {
//       alert("Please enter a complaint.");
//       return;
//     }

//     try {

//       setTextLoading(true);
//       setTextResult(null);

//       const response = await API.post("/predict", {
//         complaint: complaint
//       });

//       setTextResult(response.data);

//     } catch (error) {

//       console.log(error);

//       if (error.response) {

//         alert(
//           error.response.data?.error ||
//           "Backend returned an error."
//         );

//       } else {

//         alert("Unable to connect to backend.");

//       }

//     } finally {

//       setTextLoading(false);

//     }
//   };


//   // =====================================================
//   // IMAGE SELECTION
//   // =====================================================

//   const handleImageChange = (event) => {

//     const file = event.target.files[0];

//     if (!file) {
//       return;
//     }

//     if (!file.type.startsWith("image/")) {

//       alert("Please select a valid image.");

//       return;
//     }

//     setSelectedImage(file);

//     const previewUrl = URL.createObjectURL(file);

//     setImagePreview(previewUrl);

//     setImageResult(null);
//   };


//   // =====================================================
//   // IMAGE ANALYSIS
//   // =====================================================

//   const analyzeImage = async () => {

//     if (!selectedImage) {

//       alert("Please select an image first.");

//       return;
//     }

//     try {

//       setImageLoading(true);
//       setImageResult(null);

//       const formData = new FormData();

//       formData.append("image", selectedImage);

//       const response = await API.post(
//         "/predict-image",
//         formData
//       );

//       console.log(response.data);

//       setImageResult(response.data);

//     } catch (error) {

//       console.log("IMAGE ERROR:", error);

//       if (error.response) {

//         alert(
//           error.response.data?.error ||
//           error.response.data?.message ||
//           "Image analysis failed."
//         );

//       } else {

//         alert(
//           "Unable to connect to backend. Make sure Flask is running."
//         );

//       }

//     } finally {

//       setImageLoading(false);

//     }
//   };


//   // =====================================================
//   // RETURN UI
//   // =====================================================

//   return (

//     <div className="complaint-app">

//       {/* =================================================
//           HEADER
//       ================================================= */}

//       <header className="app-header">

//         <h1>
//           🤖 Generative AI Complaint Analyzer
//         </h1>

//         <p>
//           Analyze civic complaints using AI
//         </p>

//       </header>


//       <main className="content-container">


//         {/* =================================================
//             TEXT COMPLAINT
//         ================================================= */}

//         <section className="analysis-section">

//           <h2 className="section-title">
//             📝 Text Complaint
//           </h2>

//           <p className="section-description">
//             Describe your civic problem and our AI system
//             will analyze it.
//           </p>

//           <textarea
//             className="complaint-textarea"
//             placeholder="Example: There is a large pothole on the main road near our college..."
//             value={complaint}
//             onChange={(e) => setComplaint(e.target.value)}
//           />

//           <button
//             className="primary-button"
//             onClick={submitComplaint}
//             disabled={textLoading}
//           >
//             {textLoading
//               ? "Analyzing Complaint..."
//               : "Analyze Complaint"}
//           </button>


//           {/* =================================================
//               TEXT RESULT
//           ================================================= */}

//           {textResult && (

//             <div className="result-container">

//               <h2 className="result-title">
//                 📊 Complaint Analysis
//               </h2>


//               <div className="result-grid">

//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Category
//                   </div>

//                   <div className="result-card-value">
//                     {textResult.prediction?.Category}
//                   </div>

//                 </div>


//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Department
//                   </div>

//                   <div className="result-card-value">
//                     {textResult.prediction?.Department}
//                   </div>

//                 </div>


//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Priority
//                   </div>

//                   <div className="result-card-value">
//                     {textResult.prediction?.Priority}
//                   </div>

//                 </div>


//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Severity
//                   </div>

//                   <div className="result-card-value">
//                     {textResult.prediction?.Severity}
//                   </div>

//                 </div>


//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Sentiment
//                   </div>

//                   <div className="result-card-value">
//                     {textResult.prediction?.Sentiment}
//                   </div>

//                 </div>

//               </div>


//               <div className="ai-section">

//                 <div className="ai-card">

//                   <h3>
//                     🤖 AI Summary
//                   </h3>

//                   <p>
//                     {textResult.ai_response?.summary}
//                   </p>

//                 </div>


//                 <div className="ai-card">

//                   <h3>
//                     🔧 Recommended Action
//                   </h3>

//                   <p>
//                     {textResult.ai_response?.recommended_action}
//                   </p>

//                 </div>


//                 <div className="ai-card">

//                   <h3>
//                     💬 Citizen Response
//                   </h3>

//                   <p>
//                     {textResult.ai_response?.citizen_response}
//                   </p>

//                 </div>

//               </div>

//             </div>

//           )}

//         </section>


//         {/* =================================================
//             SEPARATOR
//         ================================================= */}

//         <div className="section-divider">
//           <span>OR</span>
//         </div>


//         {/* =================================================
//             IMAGE COMPLAINT
//         ================================================= */}

//         <section className="analysis-section">

//           <h2 className="section-title">
//             🖼️ Image Complaint
//           </h2>

//           <p className="section-description">
//             Upload an image of a civic problem such as a
//             pothole, garbage accumulation, blocked drain,
//             damaged road, or other municipal issue.
//           </p>


//           <div className="upload-area">

//             <div className="upload-icon">
//               📷
//             </div>

//             <h3>
//               Upload Civic Problem Image
//             </h3>

//             <p>
//               Select JPG, PNG, WEBP or another supported image.
//             </p>

//             <input
//               className="file-input"
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//             />

//           </div>


//           {/* =================================================
//               IMAGE PREVIEW
//           ================================================= */}

//           {imagePreview && (

//             <div className="image-preview-container">

//               <h3>
//                 Selected Image
//               </h3>

//               <img
//                 className="image-preview"
//                 src={imagePreview}
//                 alt="Selected civic complaint"
//               />

//               <br />

//               <button
//                 className="primary-button"
//                 onClick={analyzeImage}
//                 disabled={imageLoading}
//               >
//                 {imageLoading
//                   ? "Analyzing Image..."
//                   : "🔍 Analyze Image"}
//               </button>

//             </div>

//           )}


//           {/* =================================================
//               IMAGE RESULT
//           ================================================= */}

//           {imageResult && (

//             <div className="result-container">

//               <h2 className="result-title">
//                 🔍 Complete AI Image Analysis
//               </h2>


//               {/* BASIC IMAGE RESULT */}

//               <div className="result-grid">

//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Category
//                   </div>

//                   <div className="result-card-value">
//                     {imageResult.category}
//                   </div>

//                 </div>


//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Department
//                   </div>

//                   <div className="result-card-value">
//                     {imageResult.department}
//                   </div>

//                 </div>


//                 <div className="result-card">

//                   <div className="result-card-label">
//                     Confidence
//                   </div>

//                   <div className="result-card-value">

//                     {imageResult.confidence !== undefined
//                       ? `${(imageResult.confidence * 100).toFixed(2)}%`
//                       : "N/A"}

//                   </div>

//                 </div>

//               </div>


//               {/* IMAGE DESCRIPTION */}

//               <div className="description-box">

//                 <h3>
//                   🖼️ Image Description
//                 </h3>

//                 <p>
//                   {imageResult.image_description}
//                 </p>

//               </div>


//               {/* AI ANALYSIS */}

//               {imageResult.ai_analysis && (

//                 <div className="ai-section">

//                   <h2 className="result-title">
//                     🤖 AI Analysis
//                   </h2>


//                   <div className="ai-card">

//                     <h3>
//                       🚨 Problem
//                     </h3>

//                     <p>
//                       {imageResult.ai_analysis.problem}
//                     </p>

//                   </div>


//                   <div className="ai-card">

//                     <h3>
//                       ⚡ Priority
//                     </h3>

//                     <p>
//                       {imageResult.ai_analysis.priority}
//                     </p>

//                   </div>


//                   <div className="ai-card">

//                     <h3>
//                       🛑 Severity
//                     </h3>

//                     <p>
//                       {imageResult.ai_analysis.severity}
//                     </p>

//                   </div>


//                   <div className="ai-card">

//                     <h3>
//                       📝 Summary
//                     </h3>

//                     <p>
//                       {imageResult.ai_analysis.summary}
//                     </p>

//                   </div>


//                   <div className="ai-card">

//                     <h3>
//                       🔧 Recommended Action
//                     </h3>

//                     <p>
//                       {imageResult.ai_analysis.recommended_action}
//                     </p>

//                   </div>


//                   <div className="ai-card">

//                     <h3>
//                       💬 Citizen Response
//                     </h3>

//                     <p>
//                       {imageResult.ai_analysis.citizen_response}
//                     </p>

//                   </div>

//                 </div>

//               )}

//             </div>

//           )}

//         </section>

//       </main>

//     </div>

//   );
// }

// export default ComplaintForm;
import { useEffect, useState } from "react";
import API from "../services/api";

function ComplaintForm() {

    // =====================================================
    // TEXT STATES
    // =====================================================

    const [complaint, setComplaint] = useState("");
    const [textResult, setTextResult] = useState(null);
    const [textLoading, setTextLoading] = useState(false);


    // =====================================================
    // IMAGE STATES
    // =====================================================

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageResult, setImageResult] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);


    // =====================================================
    // CLEAN PREVIEW URL
    // =====================================================

    useEffect(() => {

        return () => {

            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }

        };

    }, [imagePreview]);


    // =====================================================
    // TEXT COMPLAINT
    // =====================================================

    const submitComplaint = async () => {

        if (!complaint.trim()) {

            alert("Please enter a complaint.");

            return;
        }


        try {

            setTextLoading(true);
            setTextResult(null);


            const response = await API.post(
                "/predict",
                {
                    complaint: complaint.trim()
                }
            );


            setTextResult(response.data);


        } catch (error) {

            console.error(error);


            alert(
                error.response?.data?.error ||
                "Unable to analyze complaint."
            );


        } finally {

            setTextLoading(false);

        }

    };


    // =====================================================
    // IMAGE SELECTION
    // =====================================================

    const handleImageChange = (event) => {

        const file = event.target.files[0];


        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert("Please select a valid image.");

            return;
        }


        if (file.size > 10 * 1024 * 1024) {

            alert("Please select an image smaller than 10 MB.");

            return;
        }


        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }


        setSelectedImage(file);

        setImagePreview(
            URL.createObjectURL(file)
        );

        setImageResult(null);

    };


    // =====================================================
    // IMAGE ANALYSIS
    // =====================================================

    const analyzeImage = async () => {

        if (!selectedImage) {

            alert("Please select an image first.");

            return;
        }


        try {

            setImageLoading(true);
            setImageResult(null);


            const formData = new FormData();

            formData.append(
                "image",
                selectedImage
            );


            const response = await API.post(
                "/predict-image",
                formData
            );


            setImageResult(response.data);


        } catch (error) {

            console.error(
                "IMAGE ERROR:",
                error
            );


            alert(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Image analysis failed."
            );


        } finally {

            setImageLoading(false);

        }

    };


    // =====================================================
    // CLEAR IMAGE
    // =====================================================

    const clearImage = () => {

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }


        setSelectedImage(null);

        setImagePreview(null);

        setImageResult(null);

    };


    // =====================================================
    // BADGE HELPERS
    // =====================================================

    const getPriorityClass = (priority) => {

        if (!priority) return "";

        const value = priority.toLowerCase();

        if (value === "high") {
            return "badge badge-high";
        }

        if (value === "medium") {
            return "badge badge-medium";
        }

        return "badge badge-low";

    };


    const getSeverityClass = (severity) => {

        if (!severity) return "";

        const value = severity.toLowerCase();

        if (value === "major" || value === "high") {
            return "badge badge-major";
        }

        if (value === "moderate" || value === "medium") {
            return "badge badge-moderate";
        }

        return "badge badge-minor";

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="page-container">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="page-header">

                <h1>
                    Submit a Civic Complaint
                </h1>

                <p>
                    Report civic issues using text or images.
                    Our AI system analyzes your complaint and
                    automatically routes it to the appropriate department.
                </p>

            </div>


            {/* =================================================
                INPUT CARDS
            ================================================= */}

            <div className="two-column">


                {/* =================================================
                    TEXT COMPLAINT
                ================================================= */}

                <div className="card">

                    <h2 className="card-title">
                        📝 Text Complaint
                    </h2>

                    <p className="card-subtitle">
                        Describe the problem you are experiencing.
                    </p>


                    <div style={{ marginTop: "22px" }}>

                        <label className="form-label">
                            Complaint Description
                        </label>


                        <textarea
                            className="textarea"
                            placeholder="Example: There is a large pothole near the college entrance..."
                            value={complaint}
                            onChange={(e) =>
                                setComplaint(e.target.value)
                            }
                        />

                    </div>


                    <div
                        style={{
                            marginTop: "15px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >

                        <span
                            style={{
                                color: "#94a3b8",
                                fontSize: "12px"
                            }}
                        >
                            {complaint.length} characters
                        </span>


                        <button
                            className="primary-button"
                            onClick={submitComplaint}
                            disabled={textLoading}
                        >
                            {textLoading
                                ? "Analyzing..."
                                : "Analyze Complaint"}
                        </button>

                    </div>

                </div>


                {/* =================================================
                    IMAGE COMPLAINT
                ================================================= */}

                <div className="card">

                    <h2 className="card-title">
                        🖼️ Image Complaint
                    </h2>

                    <p className="card-subtitle">
                        Upload a photo showing the civic problem.
                    </p>


                    {!imagePreview && (

                        <div
                            className="upload-area"
                            style={{ marginTop: "22px" }}
                        >

                            <div className="upload-icon">
                                📷
                            </div>

                            <div className="upload-title">
                                Upload an image
                            </div>

                            <div className="upload-text">
                                Roads, sanitation, drainage and
                                other civic issues
                            </div>


                            <input
                                className="file-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />

                        </div>

                    )}


                    {imagePreview && (

                        <div>

                            <div className="image-preview-container">

                                <img
                                    className="image-preview"
                                    src={imagePreview}
                                    alt="Selected civic complaint"
                                />

                            </div>


                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    marginTop: "12px"
                                }}
                            >

                                <button
                                    className="primary-button"
                                    onClick={analyzeImage}
                                    disabled={imageLoading}
                                >
                                    {imageLoading
                                        ? "Analyzing Image..."
                                        : "Analyze Image"}
                                </button>


                                <button
                                    className="secondary-button"
                                    onClick={clearImage}
                                >
                                    Remove
                                </button>

                            </div>

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                TEXT RESULT
            ================================================= */}

            {textResult && (

                <div className="result-section">

                    <div className="card">

                        <div className="result-header">

                            <h2>
                                🤖 AI Complaint Analysis
                            </h2>

                            <span className="badge badge-low">
                                Analysis Complete
                            </span>

                        </div>


                        <div className="result-grid">

                            <div className="result-item">

                                <div className="result-label">
                                    Category
                                </div>

                                <div className="result-value">
                                    {textResult.prediction?.Category || "-"}
                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Department
                                </div>

                                <div className="result-value">
                                    {textResult.prediction?.Department || "-"}
                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Priority
                                </div>

                                <div>
                                    <span
                                        className={getPriorityClass(
                                            textResult.prediction?.Priority
                                        )}
                                    >
                                        {textResult.prediction?.Priority || "-"}
                                    </span>
                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Severity
                                </div>

                                <div>
                                    <span
                                        className={getSeverityClass(
                                            textResult.prediction?.Severity
                                        )}
                                    >
                                        {textResult.prediction?.Severity || "-"}
                                    </span>
                                </div>

                            </div>

                        </div>


                        <div className="ai-section">

                            <h3>
                                📝 Sentiment
                            </h3>

                            <p>
                                {textResult.prediction?.Sentiment || "-"}
                            </p>

                        </div>


                        {textResult.ai_response?.summary && (

                            <div className="ai-section">

                                <h3>
                                    📝 AI Summary
                                </h3>

                                <p>
                                    {textResult.ai_response.summary}
                                </p>

                            </div>

                        )}


                        {textResult.ai_response?.recommended_action && (

                            <div className="ai-section">

                                <h3>
                                    🔧 Recommended Action
                                </h3>

                                <p>
                                    {textResult.ai_response.recommended_action}
                                </p>

                            </div>

                        )}


                        {textResult.ai_response?.citizen_response && (

                            <div className="ai-section">

                                <h3>
                                    💬 Citizen Response
                                </h3>

                                <p>
                                    {textResult.ai_response.citizen_response}
                                </p>

                            </div>

                        )}

                    </div>

                </div>

            )}


            {/* =================================================
                IMAGE RESULT
            ================================================= */}

            {imageResult && (

                <div className="result-section">

                    <div className="card">

                        <div className="result-header">

                            <h2>
                                🔍 Complete AI Image Analysis
                            </h2>

                            <span className="badge badge-low">
                                Analysis Complete
                            </span>

                        </div>


                        <div className="result-grid">

                            <div className="result-item">

                                <div className="result-label">
                                    Category
                                </div>

                                <div className="result-value">
                                    {imageResult.category || "-"}
                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Department
                                </div>

                                <div className="result-value">
                                    {imageResult.department || "-"}
                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Confidence
                                </div>

                                <div className="result-value">
                                    {imageResult.confidence !== undefined
                                        ? `${(
                                            imageResult.confidence * 100
                                        ).toFixed(2)}%`
                                        : "-"}
                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Complaint ID
                                </div>

                                <div className="result-value">
                                    {imageResult.complaint_id || "-"}
                                </div>

                            </div>

                        </div>


                        {imageResult.image_description && (

                            <div className="ai-section">

                                <h3>
                                    🖼️ Image Description
                                </h3>

                                <p>
                                    {imageResult.image_description}
                                </p>

                            </div>

                        )}


                        {imageResult.ai_analysis?.problem && (

                            <div className="ai-section">

                                <h3>
                                    🚨 Detected Problem
                                </h3>

                                <p>
                                    {imageResult.ai_analysis.problem}
                                </p>

                            </div>

                        )}


                        <div className="result-grid">

                            <div className="result-item">

                                <div className="result-label">
                                    Priority
                                </div>

                                <div>

                                    <span
                                        className={getPriorityClass(
                                            imageResult.ai_analysis?.priority
                                        )}
                                    >
                                        {imageResult.ai_analysis?.priority || "-"}
                                    </span>

                                </div>

                            </div>


                            <div className="result-item">

                                <div className="result-label">
                                    Severity
                                </div>

                                <div>

                                    <span
                                        className={getSeverityClass(
                                            imageResult.ai_analysis?.severity
                                        )}
                                    >
                                        {imageResult.ai_analysis?.severity || "-"}
                                    </span>

                                </div>

                            </div>

                        </div>


                        {imageResult.ai_analysis?.summary && (

                            <div className="ai-section">

                                <h3>
                                    📝 AI Summary
                                </h3>

                                <p>
                                    {imageResult.ai_analysis.summary}
                                </p>

                            </div>

                        )}


                        {imageResult.ai_analysis?.recommended_action && (

                            <div className="ai-section">

                                <h3>
                                    🔧 Recommended Action
                                </h3>

                                <p>
                                    {imageResult.ai_analysis.recommended_action}
                                </p>

                            </div>

                        )}


                        {imageResult.ai_analysis?.citizen_response && (

                            <div className="ai-section">

                                <h3>
                                    💬 Citizen Response
                                </h3>

                                <p>
                                    {imageResult.ai_analysis.citizen_response}
                                </p>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}

export default ComplaintForm;