/*import { useEffect, useState } from "react";
import API from "../services/api";

function Dashboard() {

    const [stats, setStats] = useState(null);

    useEffect(() => {

        fetchStats();

    }, []);

    const fetchStats = async () => {

        try {

            const response = await API.get("/stats");

            setStats(response.data);

        }
        catch (error) {

            console.log(error);

        }

    };

    if (!stats) {

        return <h2>Loading Dashboard...</h2>;

    }

    return (

        <div style={{ padding: "20px" }}>

            <h1>Complaint Analytics Dashboard</h1>

            <hr />

            <h2>Total Complaints</h2>

            <h1>{stats.total_complaints}</h1>

            <hr />

            <h2>Category Distribution</h2>

            {
                Object.entries(stats.category_distribution).map(([key, value]) => (

                    <p key={key}>
                        {key} : {value}
                    </p>

                ))
            }

            <hr />

            <h2>Department Distribution</h2>

            {
                Object.entries(stats.department_distribution).map(([key, value]) => (

                    <p key={key}>
                        {key} : {value}
                    </p>

                ))
            }

            <hr />

            <h2>Priority Distribution</h2>

            {
                Object.entries(stats.priority_distribution).map(([key, value]) => (

                    <p key={key}>
                        {key} : {value}
                    </p>

                ))
            }

            <hr />

            <h2>Severity Distribution</h2>

            {
                Object.entries(stats.severity_distribution).map(([key, value]) => (

                    <p key={key}>
                        {key} : {value}
                    </p>

                ))
            }

            <hr />

            <h2>Sentiment Distribution</h2>

            {
                Object.entries(stats.sentiment_distribution).map(([key, value]) => (

                    <p key={key}>
                        {key} : {value}
                    </p>

                ))
            }

        </div>

    );

}

export default Dashboard;*/
import { useEffect, useState } from "react";
import API from "../services/api";

function Dashboard() {

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {

        fetchStats();

    }, []);


    const fetchStats = async () => {

        try {

            const response = await API.get("/stats");

            setStats(response.data);

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    const getTotal = (data) => {

        if (!data) {
            return 0;
        }

        return Object.values(data).reduce(
            (sum, value) => sum + value,
            0
        );

    };


    const renderDistribution = (data) => {

        if (!data || Object.keys(data).length === 0) {

            return (
                <div className="empty-state">
                    No data available
                </div>
            );

        }


        const maximum = Math.max(
            ...Object.values(data)
        );


        return Object.entries(data).map(
            ([key, value]) => {

                const percentage =
                    maximum > 0
                        ? (value / maximum) * 100
                        : 0;


                return (

                    <div
                        className="distribution-item"
                        key={key}
                    >

                        <div className="distribution-header">

                            <span>
                                {key || "Unknown"}
                            </span>

                            <span>
                                {value}
                            </span>

                        </div>


                        <div className="bar-background">

                            <div
                                className="bar-fill"
                                style={{
                                    width: `${percentage}%`
                                }}
                            />

                        </div>

                    </div>

                );

            }
        );

    };


    if (loading) {

        return (

            <div className="loading-container">

                <h2>
                    Loading dashboard...
                </h2>

            </div>

        );

    }


    if (!stats) {

        return (

            <div className="page-container">

                <div className="empty-state">

                    <div className="empty-state-icon">
                        📊
                    </div>

                    <h2>
                        Unable to load dashboard
                    </h2>

                    <p>
                        Make sure the Flask backend is running.
                    </p>

                </div>

            </div>

        );

    }


    return (

        <div className="page-container">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="page-header">

                <h1>
                    Complaint Analytics
                </h1>

                <p>
                    Monitor citizen complaints and AI-generated
                    classifications in real time.
                </p>

            </div>


            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="stats-grid">


                <div className="stat-card">

                    <div className="stat-icon">
                        📋
                    </div>

                    <div className="stat-title">
                        Total Complaints
                    </div>

                    <div className="stat-value">
                        {stats.total_complaints || 0}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        🏷️
                    </div>

                    <div className="stat-title">
                        Categories
                    </div>

                    <div className="stat-value">
                        {
                            Object.keys(
                                stats.category_distribution || {}
                            ).length
                        }
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        🏢
                    </div>

                    <div className="stat-title">
                        Departments
                    </div>

                    <div className="stat-value">
                        {
                            Object.keys(
                                stats.department_distribution || {}
                            ).length
                        }
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon">
                        ⚡
                    </div>

                    <div className="stat-title">
                        High Priority
                    </div>

                    <div className="stat-value">

                        {
                            stats.priority_distribution?.High ||
                            stats.priority_distribution?.high ||
                            0
                        }

                    </div>

                </div>

            </div>


            {/* =================================================
                ANALYTICS
            ================================================= */}

            <div className="analytics-grid">


                <div className="analytics-card">

                    <h3>
                        📊 Category Distribution
                    </h3>

                    {renderDistribution(
                        stats.category_distribution
                    )}

                </div>


                <div className="analytics-card">

                    <h3>
                        🏢 Department Distribution
                    </h3>

                    {renderDistribution(
                        stats.department_distribution
                    )}

                </div>


                <div className="analytics-card">

                    <h3>
                        ⚡ Priority Distribution
                    </h3>

                    {renderDistribution(
                        stats.priority_distribution
                    )}

                </div>


                <div className="analytics-card">

                    <h3>
                        🚨 Severity Distribution
                    </h3>

                    {renderDistribution(
                        stats.severity_distribution
                    )}

                </div>


                <div className="analytics-card">

                    <h3>
                        💬 Sentiment Distribution
                    </h3>

                    {renderDistribution(
                        stats.sentiment_distribution
                    )}

                </div>


                <div className="analytics-card">

                    <h3>
                        📈 Complaint Overview
                    </h3>


                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px"
                        }}
                    >

                        <div className="detail-item">

                            <span className="detail-label">
                                Total
                            </span>

                            <span className="detail-value">
                                {stats.total_complaints || 0}
                            </span>

                        </div>


                        <div className="detail-item">

                            <span className="detail-label">
                                Categories
                            </span>

                            <span className="detail-value">
                                {
                                    getTotal(
                                        stats.category_distribution
                                    )
                                }
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default Dashboard;