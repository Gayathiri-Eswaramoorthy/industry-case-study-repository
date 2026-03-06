import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getMySubmissions } from '../../api/studentSubmissionService';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMySubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to fetch submissions');
      toast.error('Failed to fetch submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      SUBMITTED: 'bg-blue-100 text-blue-800',
      EVALUATED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900">My Submissions</h1>
          <p className="text-slate-600 mt-1">View your submitted case solutions and evaluation results</p>
        </div>

        <div className="p-6">
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No submissions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Case Title</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Submitted At</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Marks</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{submission.caseTitle}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="py-3 px-4">
                        {submission.marks !== null && submission.marks !== undefined ? (
                          <span className="font-medium text-slate-900">{submission.marks}</span>
                        ) : (
                          <span className="text-slate-400">Not evaluated</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          {submission.comment ? (
                            <p className="text-sm text-slate-600 truncate" title={submission.comment}>
                              {submission.comment}
                            </p>
                          ) : (
                            <span className="text-slate-400 text-sm">No feedback</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySubmissions;
