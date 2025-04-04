package models

import (
	"time"
)

// RequestStatus представляет статус заявки
type RequestStatus string

// Константы для статусов заявок
const (
	RequestStatusNew        RequestStatus = "new"
	RequestStatusInProgress RequestStatus = "in_progress"
	RequestStatusCompleted  RequestStatus = "completed"
	RequestStatusCancelled  RequestStatus = "cancelled"
)

// RequestPriority представляет приоритет заявки
type RequestPriority string

// Константы для приоритетов заявок
const (
	RequestPriorityLow    RequestPriority = "low"
	RequestPriorityMedium RequestPriority = "medium"
	RequestPriorityHigh   RequestPriority = "high"
)

// HelpRequest представляет заявку на помощь
type HelpRequest struct {
	ID          int             `json:"id" db:"id"`
	Title       string          `json:"title" db:"title"`
	Description string          `json:"description" db:"description"`
	Status      RequestStatus   `json:"status" db:"status"`
	CategoryID  int             `json:"categoryId" db:"category_id"`
	Priority    RequestPriority `json:"priority" db:"priority"`
	Location    string          `json:"location" db:"location"`
	RequesterID int             `json:"requesterId" db:"requester_id"`
	AssignedTo  *int            `json:"assignedTo" db:"assigned_to"`
	IsDeleted   bool            `json:"isDeleted" db:"is_deleted"`
	CreatedAt   time.Time       `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time       `json:"updatedAt" db:"updated_at"`
	CompletedAt *time.Time      `json:"completedAt" db:"completed_at"`

	// Дополнительные поля, не хранящиеся в базе данных
	Requester     *UserShort       `json:"requester,omitempty" db:"-"`
	Volunteer     *UserShort       `json:"volunteer,omitempty" db:"-"`
	Category      *RequestCategory `json:"category,omitempty" db:"-"`
	CommentsCount int              `json:"commentsCount,omitempty" db:"-"`
}

// UserShort представляет сокращенную информацию о пользователе для включения в запросы
type UserShort struct {
	ID        int    `json:"id" db:"id"`
	Username  string `json:"username" db:"username"`
	FirstName string `json:"firstName" db:"first_name"`
	LastName  string `json:"lastName" db:"last_name"`
	PhotoURL  string `json:"photoUrl" db:"photo_url"`
}

// RequestCategory представляет категорию заявки
type RequestCategory struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Icon        string    `json:"icon" db:"icon"`
	Color       string    `json:"color" db:"color"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time `json:"updatedAt" db:"updated_at"`
}

// RequestFullInfo представляет полную информацию о заявке
type RequestFullInfo struct {
	ID            int             `json:"id" db:"id"`
	Title         string          `json:"title" db:"title"`
	Description   string          `json:"description" db:"description"`
	Status        RequestStatus   `json:"status" db:"status"`
	CategoryName  string          `json:"categoryName" db:"category_name"`
	CategoryIcon  string          `json:"categoryIcon" db:"category_icon"`
	CategoryColor string          `json:"categoryColor" db:"category_color"`
	Priority      RequestPriority `json:"priority" db:"priority"`
	Location      string          `json:"location" db:"location"`
	CreatedAt     time.Time       `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time       `json:"updatedAt" db:"updated_at"`
	CompletedAt   *time.Time      `json:"completedAt" db:"completed_at"`

	RequesterID        int    `json:"requesterId" db:"requester_id"`
	RequesterUsername  string `json:"requesterUsername" db:"requester_username"`
	RequesterFirstName string `json:"requesterFirstName" db:"requester_first_name"`
	RequesterLastName  string `json:"requesterLastName" db:"requester_last_name"`
	RequesterPhotoURL  string `json:"requesterPhotoUrl" db:"requester_photo_url"`

	AssignedTo         *int    `json:"assignedTo" db:"assigned_to"`
	VolunteerUsername  *string `json:"volunteerUsername" db:"volunteer_username"`
	VolunteerFirstName *string `json:"volunteerFirstName" db:"volunteer_first_name"`
	VolunteerLastName  *string `json:"volunteerLastName" db:"volunteer_last_name"`
	VolunteerPhotoURL  *string `json:"volunteerPhotoUrl" db:"volunteer_photo_url"`

	CommentsCount int `json:"commentsCount" db:"comments_count"`
}

// RequestComment представляет комментарий к заявке
type RequestComment struct {
	ID        int       `json:"id" db:"id"`
	RequestID int       `json:"requestId" db:"request_id"`
	UserID    int       `json:"userId" db:"user_id"`
	Text      string    `json:"text" db:"text"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`

	// Дополнительные поля
	User *UserShort `json:"user,omitempty" db:"-"`
}

// RequestRating представляет оценку выполненной заявки
type RequestRating struct {
	ID        int       `json:"id" db:"id"`
	RequestID int       `json:"requestId" db:"request_id"`
	RaterID   int       `json:"raterId" db:"rater_id"`
	RatedID   int       `json:"ratedId" db:"rated_id"`
	Rating    int       `json:"rating" db:"rating"`
	Comment   string    `json:"comment" db:"comment"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`

	// Дополнительные поля
	Rater *UserShort `json:"rater,omitempty" db:"-"`
	Rated *UserShort `json:"rated,omitempty" db:"-"`
}

// RequestCreateInput представляет данные для создания новой заявки
type RequestCreateInput struct {
	Title       string          `json:"title" validate:"required,min=5,max=255"`
	Description string          `json:"description" validate:"required,min=10"`
	CategoryID  int             `json:"categoryId" validate:"required"`
	Priority    RequestPriority `json:"priority" validate:"omitempty,oneof=low medium high"`
	Location    string          `json:"location" validate:"required"`
}

// RequestUpdateInput представляет данные для обновления заявки
type RequestUpdateInput struct {
	Title       *string          `json:"title" validate:"omitempty,min=5,max=255"`
	Description *string          `json:"description" validate:"omitempty,min=10"`
	Status      *RequestStatus   `json:"status" validate:"omitempty,oneof=new in_progress completed cancelled"`
	CategoryID  *int             `json:"categoryId"`
	Priority    *RequestPriority `json:"priority" validate:"omitempty,oneof=low medium high"`
	Location    *string          `json:"location"`
	AssignedTo  *int             `json:"assignedTo"`
}

// RequestCommentInput представляет данные для создания комментария
type RequestCommentInput struct {
	Text string `json:"text" validate:"required,min=1,max=1000"`
}

// RequestRatingInput представляет данные для создания оценки
type RequestRatingInput struct {
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Comment string `json:"comment" validate:"omitempty,max=500"`
}

// RequestStatus представляет статистику по заявкам
type RequestStats struct {
	TotalRequests       int     `json:"totalRequests" db:"total_requests"`
	CompletedRequests   int     `json:"completedRequests" db:"total_completed_requests"`
	PendingRequests     int     `json:"pendingRequests" db:"pending_requests"`
	Volunteers          int     `json:"volunteers" db:"total_volunteers"`
	Users               int     `json:"users" db:"total_users"`
	Partners            int     `json:"partners" db:"total_partners"`
	TotalVolunteerHours int     `json:"totalVolunteerHours" db:"total_volunteer_hours"`
	AverageRating       float64 `json:"averageRating" db:"average_rating"`
}
