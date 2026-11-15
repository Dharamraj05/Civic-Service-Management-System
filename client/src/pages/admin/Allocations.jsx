import { Link } from 'react-router-dom';
import Alert from '../../components/Alert';
import { PriorityBadge, ResourceBadge } from '../../components/Badges';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { formatDate, formatMinutes } from '../../utils/labels';

export default function AllocationsPage() {
  const { loading, error, data } = useFetch('/allocations');

  return (
    <>
      <PageHeader
        eyebrow="Assignments"
        title="Allocations"
        subtitle="Every time a resource was locked to a complaint, including completed work."
      />
      {loading && <Spinner label="Loading allocations" />}
      <Alert type="error" message={error} />
      {data && (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Citizen</th>
                  <th>Priority</th>
                  <th>Resource</th>
                  <th>Allocation</th>
                  <th>Response</th>
                  <th>Allocated</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {data.allocations.map((row) => (
                  <tr key={row.allocation_id}>
                    <td data-label="Complaint">
                      <Link to={`/admin/complaints/${row.complaint_id}`}>#{row.complaint_id} {row.complaint_title}</Link>
                    </td>
                    <td data-label="Citizen">{row.citizen_name}</td>
                    <td data-label="Priority"><PriorityBadge priority={row.priority} /></td>
                    <td data-label="Resource">{row.registration_or_identifier}<span className="cell-sub">{row.resource_name}</span></td>
                    <td data-label="Allocation"><ResourceBadge status={row.allocation_status} /></td>
                    <td data-label="Response">{formatMinutes(row.response_minutes)}</td>
                    <td data-label="Allocated">{formatDate(row.allocated_at)}</td>
                    <td data-label="Completed">{formatDate(row.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
