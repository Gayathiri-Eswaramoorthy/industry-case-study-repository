import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function Users() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (pageNumber) => {
    try {
      const response = await axiosInstance.get(
        `/users?page=${pageNumber}&size=${size}`
      );

      const pageData = response.data.data;

      setUsers(pageData.content);
      setTotalPages(pageData.totalPages);

    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/users/${id}`);
      fetchUsers(page); // refresh current page
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  return (
    <div>
      <h2>User Management</h2>

      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.fullName} - {user.email}
            {" "}
            <button
              onClick={() => handleDelete(user.id)}
              style={{ marginLeft: "10px", color: "red" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          Previous
        </button>

        <span style={{ margin: "0 10px" }}>
          Page {page + 1} of {totalPages}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Users;
