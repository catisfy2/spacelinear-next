import { describe, it, expect } from "vitest";
import {
  calculateScore,
  pickQuestions,
  formatTime,
  getAccuracyLabel,
  getAccuracyColor,
} from "./quiz";

describe("calculateScore", () => {
  it("returns 0 when total is 0", () => {
    expect(calculateScore(0, 0)).toBe(0);
  });

  it("returns 100 when all correct", () => {
    expect(calculateScore(10, 10)).toBe(100);
  });

  it("returns 50 when half correct", () => {
    expect(calculateScore(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(calculateScore(1, 3)).toBe(33);
  });
});

describe("pickQuestions", () => {
  const questions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("returns requested count", () => {
    const picked = pickQuestions(questions, 3);
    expect(picked).toHaveLength(3);
  });

  it("returns at most the array length", () => {
    const picked = pickQuestions(questions, 20);
    expect(picked).toHaveLength(10);
  });

  it("returns empty array for empty input", () => {
    expect(pickQuestions([], 5)).toHaveLength(0);
  });

  it("returns all items when count equals array length", () => {
    const picked = pickQuestions(questions, 10);
    expect(picked).toHaveLength(10);
  });

  it("does not return duplicate items", () => {
    const picked = pickQuestions(questions, 10);
    const unique = new Set(picked);
    expect(unique.size).toBe(picked.length);
  });
});

describe("formatTime", () => {
  it("formats seconds correctly", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3661)).toBe("61:01");
  });

  it("pads seconds with leading zero", () => {
    expect(formatTime(3)).toBe("0:03");
    expect(formatTime(123)).toBe("2:03");
  });
});

describe("getAccuracyLabel", () => {
  it("returns Excellent for 90+", () => {
    expect(getAccuracyLabel(90)).toBe("Excellent");
    expect(getAccuracyLabel(100)).toBe("Excellent");
  });

  it("returns Good for 75-89", () => {
    expect(getAccuracyLabel(75)).toBe("Good");
    expect(getAccuracyLabel(80)).toBe("Good");
  });

  it("returns Fair for 60-74", () => {
    expect(getAccuracyLabel(60)).toBe("Fair");
    expect(getAccuracyLabel(70)).toBe("Fair");
  });

  it("returns Needs Improvement for below 60", () => {
    expect(getAccuracyLabel(59)).toBe("Needs Improvement");
    expect(getAccuracyLabel(0)).toBe("Needs Improvement");
  });
});

describe("getAccuracyColor", () => {
  it("returns emerald for 90+", () => {
    expect(getAccuracyColor(95)).toBe("text-emerald-500");
  });

  it("returns blue for 75-89", () => {
    expect(getAccuracyColor(80)).toBe("text-blue-500");
  });

  it("returns amber for 60-74", () => {
    expect(getAccuracyColor(65)).toBe("text-amber-500");
  });

  it("returns red for below 60", () => {
    expect(getAccuracyColor(30)).toBe("text-red-500");
  });
});
