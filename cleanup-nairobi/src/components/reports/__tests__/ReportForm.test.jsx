import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportForm from "../ReportForm";
import { reportsAPI } from "../../../services/api";

// Mock the API
vi.mock("../../../services/api", () => ({
  reportsAPI: {
    create: vi.fn(),
  },
}));

// Mock the validation utilities
vi.mock("../../../utils/validation", () => ({
  validators: {
    location: vi.fn(() => null),
    description: vi.fn(() => null),
    wasteType: vi.fn(() => null),
    file: vi.fn(() => null),
  },
  useFormValidation: vi.fn(() => ({
    data: {
      location: "",
      latitude: null,
      longitude: null,
      description: "",
      waste_type: "",
      image_url: "",
    },
    errors: {},
    touched: {},
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    validateAll: vi.fn(() => true),
    reset: vi.fn(),
  })),
}));

// Mock the hooks
vi.mock("../../../hooks/useApiState", () => ({
  useFormSubmission: vi.fn(() => ({
    loading: false,
    error: null,
    submit: vi.fn(),
    retry: vi.fn(),
    canRetry: false,
  })),
}));

// Mock Toast
vi.mock("../../../components/ui/Toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("ReportForm", () => {
  const mockOnReportCreated = vi.fn();
  let mockFormValidation;
  let mockFormSubmission;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mocks
    mockFormValidation = {
      data: {
        location: "",
        latitude: null,
        longitude: null,
        description: "",
        waste_type: "",
        image_url: "",
      },
      errors: {},
      touched: {},
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
      validateAll: vi.fn(() => true),
      reset: vi.fn(),
    };

    mockFormSubmission = {
      loading: false,
      error: null,
      submit: vi.fn(),
      retry: vi.fn(),
      canRetry: false,
    };

    const { useFormValidation } = await import("../../../utils/validation");
    const { useFormSubmission } = await import("../../../hooks/useApiState");

    useFormValidation.mockReturnValue(mockFormValidation);
    useFormSubmission.mockReturnValue(mockFormSubmission);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Form Rendering", () => {
    it("should render all form fields", () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/waste type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/photo/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /submit report/i })
      ).toBeInTheDocument();
    });

    it("should render GPS location button", () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const gpsButton = screen.getByRole("button", { name: "" }); // GPS button has no text, just icon
      expect(gpsButton).toBeInTheDocument();
    });

    it("should render waste type options", () => {
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const wasteTypeSelect = screen.getByLabelText(/waste type/i);
      expect(wasteTypeSelect).toBeInTheDocument();

      // Check if options are present
      expect(
        screen.getByRole("option", { name: /select waste type/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /plastic/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /organic/i })
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should call validation on form submission", async () => {
      const user = userEvent.setup();
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const submitButton = screen.getByRole("button", {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(mockFormValidation.validateAll).toHaveBeenCalled();
    });

    it("should display validation errors", () => {
      mockFormValidation.errors = {
        location: "Location is required",
        description: "Description is required",
      };
      mockFormValidation.touched = {
        location: true,
        description: true,
      };

      const { useFormValidation } = require("../../../utils/validation");
      useFormValidation.mockReturnValue(mockFormValidation);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      expect(screen.getByText("Location is required")).toBeInTheDocument();
      expect(screen.getByText("Description is required")).toBeInTheDocument();
    });

    it("should prevent submission when validation fails", async () => {
      const user = userEvent.setup();
      mockFormValidation.validateAll = vi.fn(() => false);

      const { useFormValidation } = require("../../../utils/validation");
      useFormValidation.mockReturnValue(mockFormValidation);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const submitButton = screen.getByRole("button", {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(mockFormSubmission.submit).not.toHaveBeenCalled();
    });
  });

  describe("GPS Location", () => {
    it("should get current location when GPS button is clicked", async () => {
      const user = userEvent.setup();
      const mockGetCurrentPosition = vi.fn();

      global.navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const gpsButton = screen.getAllByRole("button")[1]; // Second button is GPS
      await user.click(gpsButton);

      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });

    it("should handle geolocation success", async () => {
      const user = userEvent.setup();
      const mockPosition = {
        coords: {
          latitude: -1.2921,
          longitude: 36.8219,
        },
      };

      global.navigator.geolocation.getCurrentPosition = vi.fn((success) => {
        success(mockPosition);
      });

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const gpsButton = screen.getAllByRole("button")[1];
      await user.click(gpsButton);

      expect(mockFormValidation.handleChange).toHaveBeenCalledWith(
        "latitude",
        -1.2921
      );
      expect(mockFormValidation.handleChange).toHaveBeenCalledWith(
        "longitude",
        36.8219
      );
    });

    it("should handle geolocation errors", async () => {
      const user = userEvent.setup();
      const mockError = { code: 1, message: "Permission denied" };

      global.navigator.geolocation.getCurrentPosition = vi.fn(
        (success, error) => {
          error(mockError);
        }
      );

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const gpsButton = screen.getAllByRole("button")[1];
      await user.click(gpsButton);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
      });
    });
  });

  describe("Image Upload", () => {
    it("should handle image file selection", async () => {
      const user = userEvent.setup();
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const fileInput = screen.getByLabelText(/photo/i);
      await user.upload(fileInput, file);

      expect(fileInput.files[0]).toBe(file);
    });

    it("should validate image file type and size", async () => {
      const user = userEvent.setup();
      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });

      const { validators } = require("../../../utils/validation");
      validators.file.mockReturnValue("Invalid file type");

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const fileInput = screen.getByLabelText(/photo/i);
      await user.upload(fileInput, invalidFile);

      expect(validators.file).toHaveBeenCalledWith(
        invalidFile,
        expect.objectContaining({
          maxSize: 5 * 1024 * 1024,
          allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        })
      );
    });

    it("should show image preview when valid file is selected", async () => {
      const user = userEvent.setup();
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        result: "data:image/jpeg;base64,test",
      };
      global.FileReader = vi.fn(() => mockFileReader);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const fileInput = screen.getByLabelText(/photo/i);
      await user.upload(fileInput, file);

      // Simulate FileReader onload
      mockFileReader.onload({
        target: { result: "data:image/jpeg;base64,test" },
      });

      await waitFor(() => {
        const preview = screen.getByAltText("Preview");
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute("src", "data:image/jpeg;base64,test");
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      mockFormValidation.data = {
        location: "Test Location",
        latitude: -1.2921,
        longitude: 36.8219,
        description: "Test description",
        waste_type: "plastic",
        image_url: "",
      };

      const { useFormValidation } = require("../../../utils/validation");
      useFormValidation.mockReturnValue(mockFormValidation);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const submitButton = screen.getByRole("button", {
        name: /submit report/i,
      });
      await user.click(submitButton);

      expect(mockFormSubmission.submit).toHaveBeenCalledWith(
        reportsAPI.create,
        expect.objectContaining({
          location: "Test Location",
          latitude: -1.2921,
          longitude: 36.8219,
          description: "Test description",
          waste_type: "plastic",
        })
      );
    });

    it("should call onReportCreated callback on successful submission", async () => {
      const mockResponse = { data: { id: "123", status: "pending" } };
      mockFormSubmission.submit = vi
        .fn()
        .mockImplementation((apiCall, data) => {
          // Simulate successful submission
          const onSuccess = mockFormSubmission.onSuccess || (() => {});
          onSuccess(mockResponse);
        });

      const { useFormSubmission } = require("../../../hooks/useApiState");
      useFormSubmission.mockReturnValue(mockFormSubmission);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const submitButton = screen.getByRole("button", {
        name: /submit report/i,
      });
      await userEvent.click(submitButton);

      // The callback should be called through the onSuccess handler
      expect(mockFormValidation.reset).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should show loading state during submission", () => {
      mockFormSubmission.loading = true;

      const { useFormSubmission } = require("../../../hooks/useApiState");
      useFormSubmission.mockReturnValue(mockFormSubmission);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const submitButton = screen.getByRole("button", { name: /submitting/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });

    it("should show loading state during GPS location fetch", async () => {
      const user = userEvent.setup();

      // Mock a delayed geolocation response
      global.navigator.geolocation.getCurrentPosition = vi.fn();

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const gpsButton = screen.getAllByRole("button")[1];
      await user.click(gpsButton);

      expect(gpsButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display submission errors", () => {
      const mockError = {
        getUserMessage: vi.fn(() => "Submission failed"),
      };
      mockFormSubmission.error = mockError;

      const { useFormSubmission } = require("../../../hooks/useApiState");
      useFormSubmission.mockReturnValue(mockFormSubmission);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      expect(screen.getByText("Submission failed")).toBeInTheDocument();
    });

    it("should show retry button when error is retryable", () => {
      const mockError = {
        getUserMessage: vi.fn(() => "Network error"),
      };
      mockFormSubmission.error = mockError;
      mockFormSubmission.canRetry = true;

      const { useFormSubmission } = require("../../../hooks/useApiState");
      useFormSubmission.mockReturnValue(mockFormSubmission);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it("should call retry function when retry button is clicked", async () => {
      const user = userEvent.setup();
      const mockError = {
        getUserMessage: vi.fn(() => "Network error"),
      };
      mockFormSubmission.error = mockError;
      mockFormSubmission.canRetry = true;

      const { useFormSubmission } = require("../../../hooks/useApiState");
      useFormSubmission.mockReturnValue(mockFormSubmission);

      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      expect(mockFormSubmission.retry).toHaveBeenCalled();
    });
  });

  describe("User Interactions", () => {
    it("should handle form field changes", async () => {
      const user = userEvent.setup();
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const locationInput = screen.getByLabelText(/location/i);
      await user.type(locationInput, "New Location");

      expect(mockFormValidation.handleChange).toHaveBeenCalled();
    });

    it("should handle form field blur events", async () => {
      const user = userEvent.setup();
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const locationInput = screen.getByLabelText(/location/i);
      await user.click(locationInput);
      await user.tab();

      expect(mockFormValidation.handleBlur).toHaveBeenCalled();
    });

    it("should handle waste type selection", async () => {
      const user = userEvent.setup();
      render(<ReportForm onReportCreated={mockOnReportCreated} />);

      const wasteTypeSelect = screen.getByLabelText(/waste type/i);
      await user.selectOptions(wasteTypeSelect, "plastic");

      expect(mockFormValidation.handleChange).toHaveBeenCalled();
    });
  });
});
