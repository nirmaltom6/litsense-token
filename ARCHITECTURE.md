# Litsense Smart Token Management System — Architecture

## Overview
A healthcare patient queuing system that handles scheduled appointments and walk-in slots with real-time token tracking, designed for integration with Hospital Management Systems (HMS).

---

## 1. Database Schema (MongoDB)

### Collection: `doctors`
```json
{
  "_id": "ObjectId",
  "name": "string (required, max 120)",
  "specialisation": "string (required, max 80)",       // e.g. "Anaesthesiology"
  "department": "string (max 80)",
  "roomNumber": "string (max 20)",
  "avatarUrl": "string",
  "isActive": "boolean (default: true)",
  "createdAt": "Date (default: Date.now)"
}
```

### Collection: `schedules`
```json
{
  "_id": "ObjectId",
  "doctorId": "ObjectId (ref → doctors)",
  "dayOfWeek": "number (0-6)",                          // 0=Sun, 6=Sat
  "startTime": "string (HH:mm)",
  "endTime": "string (HH:mm)",
  "slotDurationMin": "number (default: 15)",
  "maxAppointments": "number (default: 20)",
  "maxWalkins": "number (default: 5)",
  "isActive": "boolean (default: true)"
}
```

### Collection: `appointments`
```json
{
  "_id": "ObjectId",
  "patientName": "string (required, max 120)",
  "patientPhone": "string (max 15)",
  "patientUhid": "string (max 30)",                     // Unique Hospital Patient ID
  "doctorId": "ObjectId (ref → doctors)",
  "appointmentDate": "Date (required)",                  // Date of visit
  "appointmentTime": "string (HH:mm, required)",        // Scheduled time
  "type": "string (enum: 'scheduled' | 'walkin')",
  "status": "string (default: 'booked')",               // booked | checked_in | in_progress | completed | no_show | cancelled
  "notes": "string",
  "source": "string (default: 'reception')",             // reception | online | hms_sync
  "hmsRefId": "string",                                 // External HMS reference
  "createdAt": "Date (default: Date.now)"
}
```

### Collection: `tokens`
```json
{
  "_id": "ObjectId",
  "tokenNumber": "string (required)",                    // Display number e.g. "A-017"
  "appointmentId": "ObjectId (ref → appointments)",
  "doctorId": "ObjectId (ref → doctors)",
  "patientName": "string (required)",                    // Denormalised for display
  "tokenType": "string (enum: 'scheduled' | 'walkin')",
  "priority": "number (required)",                       // Queue position (lower = sooner)
  "status": "string (default: 'waiting')",               // waiting | called | serving | completed | no_show | skipped
  "estimatedWaitMin": "number",
  "calledAt": "Date",
  "completedAt": "Date",
  "issuedAt": "Date (default: Date.now)",
  "qrPayload": "string"                                  // Encoded QR data for live tracking
}
```

### Collection: `tokenAuditLog`
```json
{
  "_id": "ObjectId",
  "tokenId": "ObjectId (ref → tokens)",
  "action": "string (required)",                         // issued | called | serving | completed | no_show | delayed | skipped
  "performedBy": "string",                               // Staff name or role
  "notes": "string",
  "timestamp": "Date (default: Date.now)"
}
```

### Indexes
```javascript
// doctors
db.doctors.createIndex({ isActive: 1 });

// schedules
db.schedules.createIndex({ doctorId: 1, dayOfWeek: 1 });

// appointments
db.appointments.createIndex({ doctorId: 1, appointmentDate: 1 });

// tokens
db.tokens.createIndex({ doctorId: 1, issuedAt: 1 });
db.tokens.createIndex({ status: 1 }, { partialFilterExpression: { status: { $in: ['waiting', 'called', 'serving'] } } });
db.tokens.createIndex(
  { tokenNumber: 1, issuedAt: 1 },
  { unique: true, partialFilterExpression: { issuedAt: { $exists: true } } }
);  // Ensures token_number is unique per day

// tokenAuditLog
db.tokenAuditLog.createIndex({ tokenId: 1, timestamp: -1 });
```

---

## 2. API Route Map

### Authentication & Roles
| Role | Access |
|------|--------|
| `reception` | Issue tokens, check-in, view queue |
| `doctor` | Call next, delay, mark no-show, view own queue |
| `nurse` | Same as doctor (scoped to assigned doctors) |
| `display` | Read-only: current serving + queue status |
| `admin` | Full access |

### REST API Endpoints (.NET Web API structure)

#### Doctors
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/doctors` | List all active doctors | reception, admin |
| GET | `/api/doctors/{id}` | Get doctor details + today's schedule | any |
| POST | `/api/doctors` | Create doctor | admin |
| PUT | `/api/doctors/{id}` | Update doctor | admin |

#### Schedules
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/doctors/{id}/schedules` | Get doctor schedules | any |
| POST | `/api/doctors/{id}/schedules` | Create schedule | admin |
| PUT | `/api/schedules/{id}` | Update schedule | admin |
| DELETE | `/api/schedules/{id}` | Remove schedule | admin |

#### Appointments
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/appointments?doctorId=&date=` | List appointments | reception, doctor |
| POST | `/api/appointments` | Book appointment | reception |
| PUT | `/api/appointments/{id}/checkin` | Check-in patient | reception |
| PUT | `/api/appointments/{id}/cancel` | Cancel appointment | reception |

#### Tokens (Core Queuing)
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/tokens/issue` | Generate token for appointment | reception |
| GET | `/api/tokens/queue?doctorId=` | Get live queue for doctor | any |
| PUT | `/api/tokens/{id}/call` | Doctor calls next patient | doctor |
| PUT | `/api/tokens/{id}/serving` | Mark patient as being served | doctor |
| PUT | `/api/tokens/{id}/complete` | Mark consultation complete | doctor |
| PUT | `/api/tokens/{id}/no-show` | Mark as no-show | doctor |
| PUT | `/api/tokens/{id}/skip` | Skip and move to end | doctor |
| PUT | `/api/tokens/{id}/delay` | Delay slot by N minutes | doctor |
| GET | `/api/tokens/display?doctorId=` | Public display data (now serving + next 3) | display |
| GET | `/api/tokens/{id}/track` | Patient self-tracking via QR | public |

#### HMS Integration
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/hms/sync-appointments` | Pull appointments from external HMS | admin |
| POST | `/api/hms/push-status` | Push token status to HMS | admin |
| GET | `/api/hms/health` | Check HMS adapter connectivity | admin |

#### Real-time (SignalR Hubs)
| Hub | Event | Payload | Direction |
|-----|-------|---------|-----------|
| `/hubs/queue` | `TokenCalled` | { tokenNumber, doctorId, roomNumber } | Server → Client |
| `/hubs/queue` | `QueueUpdated` | { doctorId, queue[] } | Server → Client |
| `/hubs/queue` | `TokenCompleted` | { tokenId, doctorId } | Server → Client |

---

## 3. Hybrid Queuing Algorithm

```
function calculateQueue(doctorId, date):
  appointments = getAppointments(doctorId, date, status='checked_in')
  
  scheduled = appointments.filter(type='scheduled').sortBy(appointment_time)
  walkins   = appointments.filter(type='walkin').sortBy(created_at)
  
  queue = []
  walkInIndex = 0
  
  for i, appt in enumerate(scheduled):
    queue.push(appt)                    // Always add scheduled
    
    if (i + 1) % 3 == 0 AND walkInIndex < walkins.length:
      queue.push(walkins[walkInIndex])  // Insert walk-in every 3rd slot
      walkInIndex++
  
  // Append remaining walk-ins at end
  while walkInIndex < walkins.length:
    queue.push(walkins[walkInIndex])
    walkInIndex++
  
  return queue  // Ordered list with priority numbers
```

**Rule**: For every 3 scheduled patients, 1 walk-in is interleaved. Remaining walk-ins queue at the end. Scheduled patients always have priority but walk-ins get fair gaps.

---

## 4. Token Number Format

**Pattern**: `{Prefix}-{DailySeq}`
- Scheduled: `A-001`, `A-002`, ...
- Walk-in: `W-001`, `W-002`, ...

QR Payload: `https://token.litsense.in/track/{tokenId}` (encoded as QR for patient self-tracking)

---

## 5. Frontend Pages

| Route | Component | Role | Description |
|-------|-----------|------|-------------|
| `/` | Landing | public | Product info |
| `/reception` | BillingDashboard | reception | Issue tokens, search patients, view all queues |
| `/doctor` | DoctorDashboard | doctor | Call next, manage own queue |
| `/display` | PublicDisplay | display | Large-font "Now Serving" screen |
| `/display/[doctorId]` | DoctorDisplay | display | Single-doctor display |
| `/track/[tokenId]` | PatientTracker | public | QR-scanned live position |
