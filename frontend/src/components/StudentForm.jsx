import { useState } from "react";
import API from "../services/api";

function StudentForm({ setRecommendation }) {
  const [student, setStudent] = useState({
    mathematics: "",
    physics: "",
    chemistry: "",
    biology: "",
    english: "",
  });

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/recommend", student);
      setRecommendation(response.data);
    } catch (error) {
      console.log(error);
      alert("Error fetching recommendation");
    }
  };

  return (
    <div className="card p-4 shadow">
      <h3 className="mb-3">Enter Student Scores</h3>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          className="form-control mb-3"
          placeholder="Mathematics"
          name="mathematics"
          onChange={handleChange}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Physics"
          name="physics"
          onChange={handleChange}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Chemistry"
          name="chemistry"
          onChange={handleChange}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="Biology"
          name="biology"
          onChange={handleChange}
        />

        <input
          type="number"
          className="form-control mb-3"
          placeholder="English"
          name="english"
          onChange={handleChange}
        />

        <button className="btn btn-primary w-100">
          Generate Recommendation
        </button>
      </form>
    </div>
  );
}

export default StudentForm;