package com.worksphere.hcm.employee.entity;

public enum EmployeeStatus {
    ACTIVE,
    ON_LEAVE,
    SUSPENDED,
    TERMINATED,
    PROBATION,
    NOTICE;

    /**
     * Enforce strict enterprise status transition state machine.
     * ACTIVE -> ON_LEAVE, SUSPENDED, TERMINATED, NOTICE
     * ON_LEAVE -> ACTIVE
     * SUSPENDED -> ACTIVE, TERMINATED
     * PROBATION -> ACTIVE, TERMINATED
     * NOTICE -> ACTIVE, TERMINATED
     * TERMINATED -> terminal state (no outgoing transitions allowed)
     */
    public boolean canTransitionTo(EmployeeStatus target) {
        if (this == target) {
            return true;
        }
        return switch (this) {
            case ACTIVE -> target == ON_LEAVE || target == SUSPENDED || target == TERMINATED || target == NOTICE;
            case ON_LEAVE -> target == ACTIVE;
            case SUSPENDED -> target == ACTIVE || target == TERMINATED;
            case PROBATION -> target == ACTIVE || target == TERMINATED;
            case NOTICE -> target == ACTIVE || target == TERMINATED;
            case TERMINATED -> false; // Terminal state
        };
    }
}
