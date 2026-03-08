package models

import "fmt"

type ErrorKind string

const (
	ErrorKindValidation ErrorKind = "validation_error"
	ErrorKindNotFound   ErrorKind = "not_found"
	ErrorKindConflict   ErrorKind = "conflict"
	ErrorKindStorage    ErrorKind = "storage_error"
)

type AppError struct {
	Kind    ErrorKind
	Message string
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Kind, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Kind, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewAppError(kind ErrorKind, message string, err error) *AppError {
	return &AppError{
		Kind:    kind,
		Message: message,
		Err:     err,
	}
}
