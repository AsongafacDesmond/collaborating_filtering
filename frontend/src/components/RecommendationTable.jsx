function RecommendationTable({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div className="card shadow p-4 mt-4">
      <h3>Recommendation Result</h3>

      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Recommended Subject</th>
            <th>Predicted Score</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>{recommendation.recommendedSubject}</td>
            <td>{recommendation.predictedScore}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default RecommendationTable;