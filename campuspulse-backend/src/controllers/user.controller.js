import { success } from "../utils/response.js";
import { mockDatabase } from "../services/mockData.js";

export async function profile(req, res, next) {
  try {
    return success(res, "Profile fetched successfully", {
      user: mockDatabase.currentUser
    });
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req, res, next) {
  try {
    mockDatabase.currentUser = {
      ...mockDatabase.currentUser,
      ...req.body
    };
    return success(res, "Profile updated successfully", {
      user: mockDatabase.currentUser
    });
  } catch (e) {
    next(e);
  }
}

export async function updateInterests(req, res, next) {
  try {
    const interests = Array.isArray(req.body.interests) ? req.body.interests : mockDatabase.currentUser.interests;
    mockDatabase.currentUser.interests = interests;
    return success(res, "Interests updated successfully", { interests });
  } catch (e) {
    next(e);
  }
}

export async function updateNotifications(req, res, next) {
  try {
    const preferences = req.body.preferences || req.body;
    mockDatabase.currentUser.preferences.notifications = {
      ...mockDatabase.currentUser.preferences.notifications,
      ...preferences
    };
    return success(res, "Notification preferences updated successfully", {
      notifications: mockDatabase.currentUser.preferences.notifications
    });
  } catch (e) {
    next(e);
  }
}

export async function completeOnboarding(req, res, next) {
  try {
    const { department, interests, notificationsEnabled } = req.body;
    if (department) mockDatabase.currentUser.department = department;
    if (interests) mockDatabase.currentUser.interests = interests;
    if (notificationsEnabled !== undefined) {
      mockDatabase.currentUser.preferences.notifications.urgentAlerts = notificationsEnabled;
    }
    mockDatabase.currentUser.profileCompleteness = 95;

    return success(res, "Onboarding completed successfully", {
      onboardingCompleted: true,
      user: mockDatabase.currentUser
    });
  } catch (e) {
    next(e);
  }
}

export async function changePassword(req, res, next) {
  try {
    return success(res, "Password updated successfully", {});
  } catch (e) {
    next(e);
  }
}

export async function getOnboardingData(req, res, next) {
  try {
    return success(res, "Onboarding master data fetched successfully", {
      departments: mockDatabase.departments,
      interestCategories: mockDatabase.interestCategories
    });
  } catch (e) {
    next(e);
  }
}
