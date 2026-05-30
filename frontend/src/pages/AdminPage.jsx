function AdminPage() {
  return (
    <div className="container mt-4">
      <div className="card shadow p-4">
        <h2>Admin Dashboard</h2>

        <ul className="list-group mt-3">
          <li className="list-group-item">
            Total Students: 120
          </li>

          <li className="list-group-item">
            Average Performance: 76%
          </li>

          <li className="list-group-item">
            Top Subject: Chemistry
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdminPage;