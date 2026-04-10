# Database Design - Initial Schema (Week 2)

## Core Entities

### Users
The system supports multiple user roles:
- **Admin** - system administrator
- **Manager** - office staff who creates and assigns work orders
- **Technician** - field worker who completes jobs
- **Customer** - end user who requests services

Fields: id, name, email, password, phone, role, status, hourlyRate, bio, address, profilePhoto

### Services
Services that the business offers to customers.

Fields: id, name, slug, description, durationMinutes, basePrice, isActive

### Work Orders
Core entity - represents a job/task assigned to a technician.

Fields: id, referenceNumber, customerId, technicianId, serviceId, status, priority, scheduledAt, address, issueDescription, resolutionNotes

Status flow: PENDING → EN_ROUTE → ON_SITE → IN_PROGRESS → COMPLETED

## Relationships
- User (customer) → has many → WorkOrders
- User (technician) → has many → WorkOrders
- Service → has many → WorkOrders

## Planned for Later Sprints
- Invoice and payment tracking
- Categories and skills
- Docket system for daily field reports
- Location management (states, cities)
