import { useState } from "react";
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  ChevronUp,
  ChevronDown
} from "lucide-react";

function RepositoryTable({ 
  data = [], 
  loading = false, 
  onEdit, 
  onDelete, 
  onView 
}) {
  const [sortConfig, setSortConfig] = useState({
    key: 'id',
    direction: 'asc'
  });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        text: 'Published'
      },
      draft: {
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        text: 'Draft'
      },
      archived: {
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        text: 'Archived'
      },
      review: {
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        text: 'Under Review'
      }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const ActionMenu = ({ item, index }) => (
    <div className="relative">
      <button
        onClick={() => setActionMenuOpen(actionMenuOpen === index ? null : index)}
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-slate-500" />
      </button>
      
      {actionMenuOpen === index && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onView?.(item);
                setActionMenuOpen(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <button
              onClick={() => {
                onEdit?.(item);
                setActionMenuOpen(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <button
              onClick={() => {
                onDelete?.(item);
                setActionMenuOpen(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-8 bg-slate-200 rounded"></div>
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                <div className="h-8 w-8 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide hover:text-slate-900 transition-colors"
                >
                  ID
                  {sortConfig.key === 'id' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide hover:text-slate-900 transition-colors"
                >
                  Case Title
                  {sortConfig.key === 'title' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('author')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide hover:text-slate-900 transition-colors"
                >
                  Author
                  {sortConfig.key === 'author' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('category')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide hover:text-slate-900 transition-colors"
                >
                  Category
                  {sortConfig.key === 'category' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('uploadDate')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide hover:text-slate-900 transition-colors"
                >
                  Upload Date
                  {sortConfig.key === 'uploadDate' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Status
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl">📁</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 mb-1">
                        No case studies found
                      </h3>
                      <p className="text-xs text-slate-500">
                        Get started by creating your first case study.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900">
                      #{item.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {item.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {item.author}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {new Date(item.uploadDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4">
                    <ActionMenu item={item} index={index} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RepositoryTable;
