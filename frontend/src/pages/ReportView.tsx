import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("bento_token");
    fetch(`/api/reports/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Report not found or access denied");
        }
        return r.json();
      })
      .then((data) => {
        if (data.client_id) {
          navigate(`/client/${data.client_id}?report_id=${id}`, { replace: true });
        } else {
          setError("Failed to resolve client for this report.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load report or unauthorized access.");
      });
  }, [id, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#113a87] mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">Opening saved report...</p>
      </div>
    </div>
  );
}