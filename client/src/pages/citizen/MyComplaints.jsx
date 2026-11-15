import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import ComplaintsTable from '../../components/ComplaintsTable';
import { useFetch } from '../../hooks/useFetch';

export default function MyComplaints() {
  const { loading, error, data } = useFetch('/complaints/my');

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="My complaints"
        subtitle="Every request you have submitted, including completed and cancelled ones."
      />
      {loading && <Spinner label="Loading complaints" />}
      <Alert type="error" message={error} />
      {!loading && !error && (
        <section className="card">
          <ComplaintsTable
            rows={data.complaints}
            basePath="/citizen/complaints"
            emptyTitle="No complaints yet"
            emptyText="When you submit a request, it will be listed here."
          />
        </section>
      )}
    </>
  );
}
