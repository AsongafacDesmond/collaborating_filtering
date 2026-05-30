// import { useState } from "react";
// import StudentForm from "../components/StudentForm";
// import RecommendationTable from "../components/RecommendationTable";
// import AnalyticsChart from "../components/AnalyticsChart";

// function Dashboard() {
//   const [recommendation, setRecommendation] = useState(null);

//   return (
//     <div className="container mt-4">
//       <h1 className="mb-4">
//         Collaborative Filtering Recommendation System
//       </h1>

//       <StudentForm setRecommendation={setRecommendation} />

//       <RecommendationTable recommendation={recommendation} />

//       <AnalyticsChart />
//     </div>
//   );
// }

// export default Dashboard;

import StudentForm from "../components/StudentForm";

function Dashboard() {

  return (
    <div>

      <h1>Dashboard Working</h1>

      <StudentForm />

    </div>
  );
}

export default Dashboard;