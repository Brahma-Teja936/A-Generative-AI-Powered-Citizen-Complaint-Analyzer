// // import { useEffect, useState } from "react";
// // import API from "../services/api";

// // function History() {

// //     const [complaints, setComplaints] = useState([]);
// //     const [selectedComplaint, setSelectedComplaint] = useState(null);
// //     const [loading, setLoading] = useState(true);

// //     useEffect(() => {
// //         fetchComplaints();
// //     }, []);

// //     const fetchComplaints = async () => {

// //         try {

// //             const response = await API.get("/complaints");

// //             setComplaints(response.data.complaints);

// //         } catch (error) {

// //             console.error(error);

// //         } finally {

// //             setLoading(false);

// //         }

// //     };

// //     const viewComplaint = async (id) => {

// //         try {

// //             const response = await API.get(`/complaints/${id}`);

// //             setSelectedComplaint(response.data.complaint);

// //         } catch (error) {

// //             console.error(error);

// //             alert("Unable to load complaint.");

// //         }

// //     };

// //     if (loading) {

// //         return <h2>Loading...</h2>;

// //     }

// //     return (

// //         <div style={{ padding: "20px" }}>

// //             <h1>Complaint History</h1>

// //             <table
// //                 border="1"
// //                 cellPadding="10"
// //                 style={{
// //                     borderCollapse: "collapse",
// //                     width: "100%"
// //                 }}
// //             >

// //                 <thead>

// //                     <tr>

// //                         <th>ID</th>
// //                         <th>Complaint</th>
// //                         <th>Category</th>
// //                         <th>Priority</th>
// //                         <th>Action</th>

// //                     </tr>

// //                 </thead>

// //                 <tbody>

// //                     {complaints.map((item) => (

// //                         <tr key={item.id}>

// //                             <td>{item.id}</td>

// //                             <td>{item.complaint}</td>

// //                             <td>{item.category}</td>

// //                             <td>{item.priority}</td>

// //                             <td>

// //                                 <button
// //                                     onClick={() => viewComplaint(item.id)}
// //                                 >
// //                                     View
// //                                 </button>

// //                             </td>

// //                         </tr>

// //                     ))}

// //                 </tbody>

// //             </table>

// //             {selectedComplaint && (

// //                 <div
// //                     style={{
// //                         marginTop: "40px",
// //                         border: "1px solid gray",
// //                         padding: "20px"
// //                     }}
// //                 >

// //                     <h2>Complaint Details</h2>

// //                     <p><b>Complaint:</b> {selectedComplaint.complaint}</p>

// //                     <p><b>Category:</b> {selectedComplaint.category}</p>

// //                     <p><b>Department:</b> {selectedComplaint.department}</p>

// //                     <p><b>Priority:</b> {selectedComplaint.priority}</p>

// //                     <p><b>Severity:</b> {selectedComplaint.severity}</p>

// //                     <p><b>Sentiment:</b> {selectedComplaint.sentiment}</p>

// //                     <hr/>

// //                     <h3>AI Summary</h3>

// //                     <p>{selectedComplaint.summary}</p>

// //                     <h3>Recommended Action</h3>

// //                     <p>{selectedComplaint.recommended_action}</p>

// //                     <h3>Citizen Response</h3>

// //                     <p>{selectedComplaint.citizen_response}</p>

// //                 </div>

// //             )}

// //         </div>

// //     );

// // }

// // export default History;
// --------------------------------------------------------
// import { useEffect, useState } from "react";
// import API from "../services/api";

// function History() {

//     const [complaints, setComplaints] = useState([]);
//     const [selectedComplaint, setSelectedComplaint] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         fetchComplaints();
//     }, []);

//     const fetchComplaints = async () => {

//         try {

//             const response = await API.get("/complaints");

//             setComplaints(response.data.complaints || []);

//         } catch (error) {

//             console.error("HISTORY ERROR:", error);

//         } finally {

//             setLoading(false);

//         }

//     };


//     const viewComplaint = async (id) => {

//         try {

//             const response = await API.get(`/complaints/${id}`);

//             setSelectedComplaint(response.data.complaint);

//         } catch (error) {

//             console.error("DETAIL ERROR:", error);

//             alert("Unable to load complaint.");

//         }

//     };


//     if (loading) {

//         return (
//             <div style={{ padding: "30px" }}>
//                 <h2>Loading Complaint History...</h2>
//             </div>
//         );

//     }


//     return (

//         <div
//             style={{
//                 maxWidth: "1200px",
//                 margin: "30px auto",
//                 padding: "20px",
//                 fontFamily: "Arial"
//             }}
//         >

//             <h1>Complaint History</h1>

//             <p>
//                 View all text and image-based citizen complaints.
//             </p>

//             <hr />


//             {complaints.length === 0 ? (

//                 <h3>No complaints found.</h3>

//             ) : (

//                 <div style={{ overflowX: "auto" }}>

//                     <table
//                         border="1"
//                         cellPadding="10"
//                         style={{
//                             borderCollapse: "collapse",
//                             width: "100%",
//                             minWidth: "900px"
//                         }}
//                     >

//                         <thead>

//                             <tr>

//                                 <th>ID</th>

//                                 <th>Complaint</th>

//                                 <th>Category</th>

//                                 <th>Department</th>

//                                 <th>Priority</th>

//                                 <th>Severity</th>

//                                 <th>Sentiment</th>

//                                 <th>Action</th>

//                             </tr>

//                         </thead>


//                         <tbody>

//                             {complaints.map((item) => (

//                                 <tr key={item.id}>

//                                     <td>
//                                         {item.id}
//                                     </td>


//                                     <td
//                                         style={{
//                                             maxWidth: "250px",
//                                             wordBreak: "break-word"
//                                         }}
//                                     >
//                                         {item.complaint ||
//                                             item.complaint_text ||
//                                             item.image_description ||
//                                             "Image Complaint"}
//                                     </td>


//                                     <td>
//                                         {item.category || "-"}
//                                     </td>


//                                     <td>
//                                         {item.department || "-"}
//                                     </td>


//                                     <td>
//                                         {item.priority || "-"}
//                                     </td>


//                                     <td>
//                                         {item.severity || "-"}
//                                     </td>


//                                     <td>
//                                         {item.sentiment || "-"}
//                                     </td>


//                                     <td>

//                                         <button
//                                             onClick={() =>
//                                                 viewComplaint(item.id)
//                                             }
//                                         >
//                                             View Details
//                                         </button>

//                                     </td>

//                                 </tr>

//                             ))}

//                         </tbody>

//                     </table>

//                 </div>

//             )}


//             {/* =====================================================
//                 SELECTED COMPLAINT DETAILS
//             ===================================================== */}

//             {selectedComplaint && (

//                 <div
//                     style={{
//                         marginTop: "40px",
//                         padding: "25px",
//                         border: "1px solid #ccc",
//                         borderRadius: "8px",
//                         backgroundColor: "#fafafa"
//                     }}
//                 >

//                     <h2>
//                         Complaint Details
//                     </h2>


//                     <p>
//                         <b>Complaint ID:</b>{" "}
//                         {selectedComplaint.id}
//                     </p>


//                     <p>
//                         <b>Complaint:</b>{" "}
//                         {selectedComplaint.complaint ||
//                             selectedComplaint.complaint_text ||
//                             selectedComplaint.image_description ||
//                             "Image Complaint"}
//                     </p>


//                     {/* IMAGE INFORMATION */}

//                     {selectedComplaint.image_description && (

//                         <div>

//                             <hr />

//                             <h3>
//                                 🖼️ Image Complaint
//                             </h3>

//                             <p>
//                                 <b>Image Description:</b>{" "}
//                                 {selectedComplaint.image_description}
//                             </p>

//                             {selectedComplaint.image_path && (

//                                 <p>
//                                     <b>Image Path:</b>{" "}
//                                     {selectedComplaint.image_path}
//                                 </p>

//                             )}

//                         </div>

//                     )}


//                     {/* PREDICTION INFORMATION */}

//                     <hr />

//                     <h3>
//                         AI Classification
//                     </h3>


//                     <p>
//                         <b>Category:</b>{" "}
//                         {selectedComplaint.category || "-"}
//                     </p>


//                     <p>
//                         <b>Department:</b>{" "}
//                         {selectedComplaint.department || "-"}
//                     </p>


//                     <p>
//                         <b>Confidence:</b>{" "}

//                         {selectedComplaint.confidence !== null &&
//                         selectedComplaint.confidence !== undefined
//                             ? `${(
//                                 selectedComplaint.confidence * 100
//                             ).toFixed(2)}%`
//                             : "-"}
//                     </p>


//                     <p>
//                         <b>Priority:</b>{" "}
//                         {selectedComplaint.priority || "-"}
//                     </p>


//                     <p>
//                         <b>Severity:</b>{" "}
//                         {selectedComplaint.severity || "-"}
//                     </p>


//                     <p>
//                         <b>Sentiment:</b>{" "}
//                         {selectedComplaint.sentiment || "-"}
//                     </p>


//                     {/* IMAGE PROBLEM */}

//                     {selectedComplaint.problem && (

//                         <div>

//                             <hr />

//                             <h3>
//                                 🔍 Detected Problem
//                             </h3>

//                             <p>
//                                 {selectedComplaint.problem}
//                             </p>

//                         </div>

//                     )}


//                     {/* AI SUMMARY */}

//                     {selectedComplaint.summary && (

//                         <div>

//                             <hr />

//                             <h3>
//                                 🤖 AI Summary
//                             </h3>

//                             <p>
//                                 {selectedComplaint.summary}
//                             </p>

//                         </div>

//                     )}


//                     {/* RECOMMENDED ACTION */}

//                     {selectedComplaint.recommended_action && (

//                         <div>

//                             <hr />

//                             <h3>
//                                 Recommended Action
//                             </h3>

//                             <p>
//                                 {selectedComplaint.recommended_action}
//                             </p>

//                         </div>

//                     )}


//                     {/* CITIZEN RESPONSE */}

//                     {selectedComplaint.citizen_response && (

//                         <div>

//                             <hr />

//                             <h3>
//                                 Citizen Response
//                             </h3>

//                             <p>
//                                 {selectedComplaint.citizen_response}
//                             </p>

//                         </div>

//                     )}


//                     {/* CREATED DATE */}

//                     {selectedComplaint.created_at && (

//                         <div>

//                             <hr />

//                             <p>
//                                 <b>Created At:</b>{" "}
//                                 {selectedComplaint.created_at}
//                             </p>

//                         </div>

//                     )}


//                     <br />

//                     <button
//                         onClick={() => setSelectedComplaint(null)}
//                     >
//                         Close Details
//                     </button>

//                 </div>

//             )}

//         </div>

//     );

// }

// export default History;
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

function History() {

    const [complaints, setComplaints] = useState([]);

    const [selectedComplaint, setSelectedComplaint] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [categoryFilter, setCategoryFilter] =
        useState("All");

    const [priorityFilter, setPriorityFilter] =
        useState("All");


    // =====================================================
    // FETCH COMPLAINTS
    // =====================================================

    useEffect(() => {

        fetchComplaints();

    }, []);


    const fetchComplaints = async () => {

        try {

            const response =
                await API.get("/complaints");

            setComplaints(
                response.data.complaints || []
            );

        } catch (error) {

            console.error(
                "History error:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // VIEW DETAILS
    // =====================================================

    const viewComplaint = async (id) => {

        try {

            const response =
                await API.get(
                    `/complaints/${id}`
                );

            setSelectedComplaint(
                response.data.complaint
            );

        } catch (error) {

            console.error(error);

            alert(
                "Unable to load complaint details."
            );

        }

    };


    // =====================================================
    // FILTER DATA
    // =====================================================

    const categories = useMemo(() => {

        const values =
            complaints
                .map(item => item.category)
                .filter(Boolean);

        return [
            "All",
            ...new Set(values)
        ];

    }, [complaints]);


    const filteredComplaints =
        complaints.filter(item => {

            const complaintText =
                item.complaint ||
                item.complaint_text ||
                item.image_description ||
                "";


            const matchesSearch =
                complaintText
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );


            const matchesCategory =
                categoryFilter === "All" ||
                item.category === categoryFilter;


            const matchesPriority =
                priorityFilter === "All" ||
                item.priority === priorityFilter;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesPriority
            );

        });


    // =====================================================
    // BADGES
    // =====================================================

    const priorityBadge = (value) => {

        if (!value) return "-";

        const lower =
            value.toLowerCase();


        let className =
            "badge badge-low";


        if (lower === "high") {

            className =
                "badge badge-high";

        } else if (lower === "medium") {

            className =
                "badge badge-medium";

        }


        return (
            <span className={className}>
                {value}
            </span>
        );

    };


    const severityBadge = (value) => {

        if (!value) return "-";

        const lower =
            value.toLowerCase();


        let className =
            "badge badge-minor";


        if (
            lower === "major" ||
            lower === "high"
        ) {

            className =
                "badge badge-major";

        } else if (
            lower === "moderate" ||
            lower === "medium"
        ) {

            className =
                "badge badge-moderate";

        }


        return (
            <span className={className}>
                {value}
            </span>
        );

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="loading-container">

                <h2>
                    Loading complaint history...
                </h2>

            </div>

        );

    }


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
                    Complaint History
                </h1>

                <p>
                    Search and review previously submitted
                    citizen complaints.
                </p>

            </div>


            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="card">

                <div className="history-toolbar">

                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search complaints..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />


                    <select
                        className="filter-select"
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(
                                e.target.value
                            )
                        }
                    >

                        {categories.map(
                            category => (

                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>

                            )
                        )}

                    </select>


                    <select
                        className="filter-select"
                        value={priorityFilter}
                        onChange={(e) =>
                            setPriorityFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Priorities
                        </option>

                        <option value="High">
                            High
                        </option>

                        <option value="Medium">
                            Medium
                        </option>

                        <option value="Low">
                            Low
                        </option>

                    </select>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                {filteredComplaints.length === 0 ? (

                    <div className="empty-state">

                        <div className="empty-state-icon">
                            🔍
                        </div>

                        <h3>
                            No complaints found
                        </h3>

                        <p>
                            Try changing your search
                            or filters.
                        </p>

                    </div>

                ) : (

                    <div className="table-wrapper">

                        <table className="data-table">

                            <thead>

                                <tr>

                                    <th>ID</th>

                                    <th>Complaint</th>

                                    <th>Category</th>

                                    <th>Department</th>

                                    <th>Priority</th>

                                    <th>Severity</th>

                                    <th>Action</th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredComplaints.map(
                                    item => {

                                        const text =
                                            item.complaint ||
                                            item.complaint_text ||
                                            item.image_description ||
                                            "Image Complaint";


                                        return (

                                            <tr
                                                key={item.id}
                                            >

                                                <td>
                                                    #{item.id}
                                                </td>


                                                <td
                                                    style={{
                                                        maxWidth:
                                                            "280px"
                                                    }}
                                                >

                                                    <div
                                                        style={{
                                                            overflow:
                                                                "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap"
                                                        }}
                                                    >
                                                        {text}
                                                    </div>

                                                </td>


                                                <td>
                                                    {item.category ||
                                                        "-"}
                                                </td>


                                                <td>
                                                    {item.department ||
                                                        "-"}
                                                </td>


                                                <td>
                                                    {priorityBadge(
                                                        item.priority
                                                    )}
                                                </td>


                                                <td>
                                                    {severityBadge(
                                                        item.severity
                                                    )}
                                                </td>


                                                <td>

                                                    <button
                                                        className="secondary-button"
                                                        onClick={() =>
                                                            viewComplaint(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                DETAILS
            ================================================= */}

            {selectedComplaint && (

                <div className="details-card">

                    <div className="details-header">

                        <div>

                            <h2>
                                Complaint #{selectedComplaint.id}
                            </h2>

                            <p
                                style={{
                                    margin: "5px 0 0",
                                    color: "#64748b",
                                    fontSize: "13px"
                                }}
                            >
                                Complete AI analysis
                            </p>

                        </div>


                        <button
                            className="secondary-button"
                            onClick={() =>
                                setSelectedComplaint(null)
                            }
                        >
                            Close
                        </button>

                    </div>


                    <div className="detail-grid">


                        <div className="detail-item">

                            <span className="detail-label">
                                Category
                            </span>

                            <span className="detail-value">
                                {selectedComplaint.category ||
                                    "-"}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Department
                            </span>

                            <span className="detail-value">
                                {selectedComplaint.department ||
                                    "-"}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Confidence
                            </span>

                            <span className="detail-value">

                                {selectedComplaint.confidence !==
                                    undefined &&
                                selectedComplaint.confidence !==
                                    null
                                    ? `${(
                                        selectedComplaint.confidence *
                                        100
                                    ).toFixed(2)}%`
                                    : "-"}

                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Priority
                            </span>

                            <span className="detail-value">
                                {priorityBadge(
                                    selectedComplaint.priority
                                )}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Severity
                            </span>

                            <span className="detail-value">
                                {severityBadge(
                                    selectedComplaint.severity
                                )}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Sentiment
                            </span>

                            <span className="detail-value">
                                {selectedComplaint.sentiment ||
                                    "-"}
                            </span>

                        </div>


                        <div className="detail-item full">

                            <span className="detail-label">
                                Complaint
                            </span>

                            <span className="detail-value">
                                {selectedComplaint.complaint ||
                                    selectedComplaint.complaint_text ||
                                    selectedComplaint.image_description ||
                                    "Image Complaint"}
                            </span>

                        </div>


                        {selectedComplaint.image_description && (

                            <div className="detail-item full">

                                <span className="detail-label">
                                    Image Description
                                </span>

                                <span className="detail-value">
                                    {
                                        selectedComplaint.image_description
                                    }
                                </span>

                            </div>

                        )}


                        {selectedComplaint.problem && (

                            <div className="detail-item full">

                                <span className="detail-label">
                                    Detected Problem
                                </span>

                                <span className="detail-value">
                                    {selectedComplaint.problem}
                                </span>

                            </div>

                        )}


                        {selectedComplaint.summary && (

                            <div className="detail-item full">

                                <span className="detail-label">
                                    AI Summary
                                </span>

                                <span className="detail-value">
                                    {selectedComplaint.summary}
                                </span>

                            </div>

                        )}


                        {selectedComplaint.recommended_action && (

                            <div className="detail-item full">

                                <span className="detail-label">
                                    Recommended Action
                                </span>

                                <span className="detail-value">
                                    {
                                        selectedComplaint.recommended_action
                                    }
                                </span>

                            </div>

                        )}


                        {selectedComplaint.citizen_response && (

                            <div className="detail-item full">

                                <span className="detail-label">
                                    Citizen Response
                                </span>

                                <span className="detail-value">
                                    {
                                        selectedComplaint.citizen_response
                                    }
                                </span>

                            </div>

                        )}


                        {selectedComplaint.created_at && (

                            <div className="detail-item full">

                                <span className="detail-label">
                                    Created At
                                </span>

                                <span className="detail-value">
                                    {
                                        selectedComplaint.created_at
                                    }
                                </span>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>

    );
}

export default History;
