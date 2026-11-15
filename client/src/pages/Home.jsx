import { Link } from 'react-router-dom';

const services = [
  {
    name: 'Medical Emergency',
    resource: 'Ambulance',
    text: 'Injuries, breathing trouble, and other cases that need medical transport.'
  },
  {
    name: 'Water Supply',
    resource: 'Water tanker',
    text: 'Empty sumps and failed municipal supply that need a tanker.'
  },
  {
    name: 'Garbage Collection',
    resource: 'Garbage truck',
    text: 'Missed pickup, overflowing bins, and debris blocking a lane.'
  },
  {
    name: 'Electricity Repair',
    resource: 'Repair team',
    text: 'Outages, street lights, and unsafe faults such as a downed wire.'
  },
  {
    name: 'Police Assistance',
    resource: 'Patrol vehicle',
    text: 'Public safety incidents that need a patrol vehicle on site.'
  }
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">City operations desk</p>
          <h1>Civic Service Management System</h1>
          <p className="lede">
            Smart resource allocation for better public services. Report a problem,
            and the desk queues it by urgency before assigning a free ambulance,
            tanker, truck, repair crew, or patrol vehicle.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">Report a problem</Link>
            <Link className="btn btn-secondary" to="/login">Staff and citizen login</Link>
          </div>
        </div>
        <aside className="hero-panel" aria-label="What happens after you submit">
          <p className="panel-kicker">After you submit</p>
          <ol>
            <li><strong>Submitted</strong><span>Your request is recorded with an ID.</span></li>
            <li><strong>Waiting</strong><span>It joins the priority queue.</span></li>
            <li><strong>Assigned</strong><span>A matching free resource is locked for you.</span></li>
            <li><strong>In progress</strong><span>The crew has started the job.</span></li>
            <li><strong>Completed</strong><span>The resource is released for the next request.</span></li>
          </ol>
        </aside>
      </section>

      <section id="services" className="section">
        <div className="section-head">
          <h2>Civic services</h2>
          <p>Each service is handled by one department and one kind of resource.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article key={service.name} className="service-card">
              <h3>{service.name}</h3>
              <p>{service.text}</p>
              <span>Resource · {service.resource}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="scheduling" className="section section-alt">
        <div className="section-head">
          <h2>How the city desk schedules work</h2>
          <p>Limited vehicles cannot serve every request at once. The desk follows three rules.</p>
        </div>
        <div className="rule-grid">
          <article>
            <span>01</span>
            <h3>Priority</h3>
            <p>Critical requests are served before high, medium, and low requests. Priority 1 is the most urgent.</p>
          </article>
          <article>
            <span>02</span>
            <h3>First come, first served</h3>
            <p>When two requests have the same priority, the older one is allocated first.</p>
          </article>
          <article>
            <span>03</span>
            <h3>One job at a time</h3>
            <p>A resource marked busy cannot be given to a second open complaint. It returns to available only when the job is finished.</p>
          </article>
        </div>
      </section>

      <section className="section notice-band">
        <div>
          <h2>This desk is for recorded civic requests</h2>
          <p>
            If someone is in immediate danger, contact your local emergency number directly.
            CSMS keeps a trackable record and assigns city resources that are free.
          </p>
        </div>
        <Link className="btn btn-primary" to="/login">Go to login</Link>
      </section>
    </>
  );
}
