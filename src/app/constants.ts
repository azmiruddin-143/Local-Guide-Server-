// Fields to exclude from query filtering
export const excludeField = ['searchTerm', 'page', 'limit', 'sort', 'fields'];

// User searchable fields
export const UserSearchableFields = ['name', 'email', 'location', 'expertise'];

// Tour searchable fields
export const TourSearchableFields = ['title', 'description', 'city', 'country'];

// Booking searchable fields (only direct fields, not populated)
export const BookingSearchableFields = ['specialRequests', 'cancellationReason'];

// Review searchable fields
export const ReviewSearchableFields = ['content'];


// payout searchable fields (only string fields, not numbers)
export const payoutSearchableFields = ['paymentMethod', 'status', 'currency'];

// payment searchable fields
export const PaymentSearchableFields = ['transactionId', 'status', 'provider', 'currency'];

