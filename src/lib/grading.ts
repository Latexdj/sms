// Strict Ghana Education Service (GES) Grade bounds parsing

export type GESGrade = {
  grade: number;
  remark: string;
};

export function calculateGESGrade(totalScore: number): GESGrade {
  if (totalScore >= 80 && totalScore <= 100) return { grade: 1, remark: "Highest" };
  if (totalScore >= 70 && totalScore <= 79)  return { grade: 2, remark: "Higher" };
  if (totalScore >= 65 && totalScore <= 69)  return { grade: 3, remark: "High" };
  if (totalScore >= 60 && totalScore <= 64)  return { grade: 4, remark: "High Average" };
  if (totalScore >= 55 && totalScore <= 59)  return { grade: 5, remark: "Average" };
  if (totalScore >= 50 && totalScore <= 54)  return { grade: 6, remark: "Low Average" };
  if (totalScore >= 45 && totalScore <= 49)  return { grade: 7, remark: "Low" };
  if (totalScore >= 40 && totalScore <= 44)  return { grade: 8, remark: "Lower" };
  
  // 0 - 39 is historically Grade 9 natively failing bounds
  return { grade: 9, remark: "Lowest" };
}

// Computes entire line tracking limits safely
export function compileRowTotals(classScore: number, examScore: number) {
  const total = Number(classScore) + Number(examScore);
  const evaluation = calculateGESGrade(total);
  
  return {
    total,
    grade: evaluation.grade,
    remark: evaluation.remark
  };
}
