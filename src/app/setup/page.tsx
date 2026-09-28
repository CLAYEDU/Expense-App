"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

import { saveFinancialProfile } from "@/lib/financial-profile";

import type {
  Country,
  Currency,
  FinancialProfile,
  IncomeFrequency,
} from "@/types/finance";

const goals = [
  "Emergency fund",
  "Home",
  "Education",
  "Vehicle",
  "Travel",
  "Retirement",
  "Long-term wealth",
  "Other",
];

export default function SetupPage() {
  const router = useRouter();

  const { user, loading: authLoading } =
    useAuth();

  const [step, setStep] =
    useState(1);

  const [country, setCountry] =
    useState<Country | null>(null);

  const [monthlyIncome, setMonthlyIncome] =
    useState("");

  const [incomeFrequency, setIncomeFrequency] =
    useState<IncomeFrequency>("monthly");

  const [essentialExpenses, setEssentialExpenses] =
    useState("");

  const [recurringExpenses, setRecurringExpenses] =
    useState("");

  const [hasEmi, setHasEmi] =
    useState(false);

  const [monthlyEmi, setMonthlyEmi] =
    useState("");

  const [currentSavings, setCurrentSavings] =
    useState("");

  const [hasEmergencyFund, setHasEmergencyFund] =
    useState(false);

  const [emergencyFund, setEmergencyFund] =
    useState("");

  const [monthlyInvestments, setMonthlyInvestments] =
    useState("");

  const [selectedGoals, setSelectedGoals] =
    useState<string[]>([]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [
    authLoading,
    user,
    router,
  ]);

  const currency: Currency =
    country === "AE"
      ? "AED"
      : "INR";

  const currencySymbol =
    currency === "AED"
      ? "د.إ"
      : "₹";

  const progress = useMemo(
    () => (step / 6) * 100,
    [step]
  );

  function toggleGoal(goal: string) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter(
            (item) => item !== goal
          )
        : [...current, goal]
    );
  }

  function nextStep() {
    setError("");

    if (step === 1 && !country) {
      setError(
        "Please choose your country."
      );
      return;
    }

    if (
      step === 2 &&
      Number(monthlyIncome) <= 0
    ) {
      setError(
        "Please enter your regular income."
      );
      return;
    }

    if (
      step === 3 &&
      Number(essentialExpenses) < 0
    ) {
      setError(
        "Please enter a valid amount."
      );
      return;
    }

    if (
      step === 4 &&
      hasEmi &&
      Number(monthlyEmi) <= 0
    ) {
      setError(
        "Please enter your monthly EMI."
      );
      return;
    }

    if (
      step === 5 &&
      Number(currentSavings) < 0
    ) {
      setError(
        "Please enter a valid savings amount."
      );
      return;
    }

    if (step < 6) {
      setStep((current) =>
        current + 1
      );
    }
  }

  function previousStep() {
    setError("");

    if (step > 1) {
      setStep((current) =>
        current - 1
      );
    }
  }

  async function finishSetup() {
    if (!user) return;

    setError("");
    setSaving(true);

    try {
      const profile: FinancialProfile = {
          country: country!,
          currency,

          monthlyIncome: Number(monthlyIncome) || 0,

          incomeFrequency,

          essentialExpenses: Number(essentialExpenses) || 0,

          recurringExpenses: Number(recurringExpenses) || 0,

          monthlyEmi: hasEmi
              ? Number(monthlyEmi) || 0
              : 0,

          currentSavings: Number(currentSavings) || 0,

          emergencyFund: hasEmergencyFund
              ? Number(emergencyFund) || 0
              : 0,

          monthlyInvestments: Number(monthlyInvestments) || 0,

          hasEmi,

          hasEmergencyFund,

          financialGoals: selectedGoals,

          setupCompleted: true,
          monthlySavings: 0
      };

      await saveFinancialProfile(
        user.uid,
        profile
      );

      router.replace("/dashboard");
    } catch (error) {
      console.error(error);

      setError(
        "We couldn't save your financial setup. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1f5c4a] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-6 sm:px-8 sm:py-10">

      <div className="mx-auto max-w-4xl">

        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">
              Finora
            </div>

            <p className="mt-1 text-xs text-[#77776f]">
              Financial setup
            </p>
          </div>

          <div className="text-sm text-[#77776f]">
            {step} / 6
          </div>
        </header>

        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-[#e7e5df]">
          <div
            className="h-full rounded-full bg-[#1f5c4a] transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <section className="rounded-[30px] border border-[#e7e5df] bg-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.06)] sm:p-10">

          {step === 1 && (
            <StepCountry
              country={country}
              setCountry={setCountry}
            />
          )}

          {step === 2 && (
            <StepIncome
              currencySymbol={currencySymbol}
              monthlyIncome={monthlyIncome}
              setMonthlyIncome={
                setMonthlyIncome
              }
              incomeFrequency={
                incomeFrequency
              }
              setIncomeFrequency={
                setIncomeFrequency
              }
            />
          )}

          {step === 3 && (
            <StepExpenses
              currencySymbol={
                currencySymbol
              }
              essentialExpenses={
                essentialExpenses
              }
              setEssentialExpenses={
                setEssentialExpenses
              }
              recurringExpenses={
                recurringExpenses
              }
              setRecurringExpenses={
                setRecurringExpenses
              }
            />
          )}

          {step === 4 && (
            <StepEmi
              currencySymbol={
                currencySymbol
              }
              hasEmi={hasEmi}
              setHasEmi={setHasEmi}
              monthlyEmi={monthlyEmi}
              setMonthlyEmi={
                setMonthlyEmi
              }
            />
          )}

          {step === 5 && (
            <StepFunds
              currencySymbol={
                currencySymbol
              }
              currentSavings={
                currentSavings
              }
              setCurrentSavings={
                setCurrentSavings
              }
              hasEmergencyFund={
                hasEmergencyFund
              }
              setHasEmergencyFund={
                setHasEmergencyFund
              }
              emergencyFund={
                emergencyFund
              }
              setEmergencyFund={
                setEmergencyFund
              }
              monthlyInvestments={
                monthlyInvestments
              }
              setMonthlyInvestments={
                setMonthlyInvestments
              }
            />
          )}

          {step === 6 && (
            <StepGoals
              selectedGoals={
                selectedGoals
              }
              toggleGoal={
                toggleGoal
              }
            />
          )}

          {error && (
            <div className="mt-7 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-4">

            <button
              type="button"
              onClick={previousStep}
              disabled={step === 1}
              className="rounded-2xl px-5 py-3 text-sm font-medium text-[#66665f] transition hover:bg-[#f5f4f0] disabled:invisible"
            >
              Back
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-2xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#205543]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={finishSetup}
                disabled={saving}
                className="rounded-2xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#205543] disabled:opacity-60"
              >
                {saving
                  ? "Creating your plan..."
                  : "Finish setup"}
              </button>
            )}

          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-[#85857e]">
          Your information is used to
          personalize your financial planning
          experience.
        </p>
      </div>
    </main>
  );
}

function StepCountry({
  country,
  setCountry,
}: {
  country: Country | null;
  setCountry: (
    country: Country
  ) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Let's start"
        title="Where do you live?"
        description="This helps us use the right currency, country settings and financial context."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">

        <CountryCard
          selected={country === "IN"}
          onClick={() =>
            setCountry("IN")
          }
          flag="🇮🇳"
          title="India"
          subtitle="Indian Rupee • INR ₹"
        />

        <CountryCard
          selected={country === "AE"}
          onClick={() =>
            setCountry("AE")
          }
          flag="🇦🇪"
          title="United Arab Emirates"
          subtitle="UAE Dirham • AED د.إ"
        />

      </div>
    </div>
  );
}

function CountryCard({
  selected,
  onClick,
  flag,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  flag: string;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[24px] border p-6 text-left transition ${
        selected
          ? "border-[#1f5c4a] bg-[#edf5f1] ring-4 ring-[#1f5c4a]/10"
          : "border-[#e5e3dd] bg-[#fafaf8] hover:border-[#bcbcb4]"
      }`}
    >
      <div className="text-4xl">
        {flag}
      </div>

      <div className="mt-5 font-semibold">
        {title}
      </div>

      <div className="mt-1 text-sm text-[#77776f]">
        {subtitle}
      </div>
    </button>
  );
}

function StepIncome({
  currencySymbol,
  monthlyIncome,
  setMonthlyIncome,
  incomeFrequency,
  setIncomeFrequency,
}: {
  currencySymbol: string;
  monthlyIncome: string;
  setMonthlyIncome: (
    value: string
  ) => void;
  incomeFrequency: IncomeFrequency;
  setIncomeFrequency: (
    value: IncomeFrequency
  ) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 2"
        title="What is your regular income?"
        description="Use your usual income. You can update this later whenever your situation changes."
      />

      <div className="mt-10 max-w-xl">

        <label className="mb-2 block text-sm font-medium">
          Income amount
        </label>

        <div className="flex overflow-hidden rounded-2xl border border-[#deddd7] bg-[#fafaf8] focus-within:border-[#1f5c4a] focus-within:ring-4 focus-within:ring-[#1f5c4a]/10">
          <div className="flex items-center px-4 text-sm text-[#77776f]">
            {currencySymbol}
          </div>

          <input
            type="number"
            min="0"
            value={monthlyIncome}
            onChange={(event) =>
              setMonthlyIncome(
                event.target.value
              )
            }
            placeholder="30,000"
            className="w-full bg-transparent px-3 py-4 text-xl outline-none"
          />
        </div>

        <label className="mb-2 mt-7 block text-sm font-medium">
          How often do you receive it?
        </label>

        <select
          value={incomeFrequency}
          onChange={(event) =>
            setIncomeFrequency(
              event.target
                .value as IncomeFrequency
            )
          }
          className="w-full rounded-2xl border border-[#deddd7] bg-[#fafaf8] px-4 py-4 outline-none focus:border-[#1f5c4a]"
        >
          <option value="monthly">
            Monthly
          </option>

          <option value="weekly">
            Weekly
          </option>

          <option value="biweekly">
            Every two weeks
          </option>

          <option value="irregular">
            Irregular
          </option>
        </select>
      </div>
    </div>
  );
}

function StepExpenses({
  currencySymbol,
  essentialExpenses,
  setEssentialExpenses,
  recurringExpenses,
  setRecurringExpenses,
}: {
  currencySymbol: string;
  essentialExpenses: string;
  setEssentialExpenses: (
    value: string
  ) => void;
  recurringExpenses: string;
  setRecurringExpenses: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 3"
        title="What does it cost to live each month?"
        description="Give us a reasonable estimate. We will improve these numbers later using your actual expense history."
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">

        <MoneyInput
          label="Essential expenses"
          description="Food, rent, utilities, transport and other necessary expenses."
          symbol={currencySymbol}
          value={essentialExpenses}
          setValue={
            setEssentialExpenses
          }
        />

        <MoneyInput
          label="Other recurring expenses"
          description="Subscriptions, memberships and other regular commitments."
          symbol={currencySymbol}
          value={recurringExpenses}
          setValue={
            setRecurringExpenses
          }
        />

      </div>
    </div>
  );
}

function StepEmi({
  currencySymbol,
  hasEmi,
  setHasEmi,
  monthlyEmi,
  setMonthlyEmi,
}: {
  currencySymbol: string;
  hasEmi: boolean;
  setHasEmi: (
    value: boolean
  ) => void;
  monthlyEmi: string;
  setMonthlyEmi: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 4"
        title="Do you have an EMI or loan payment?"
        description="This is important because your recommendations should account for fixed financial commitments."
      />

      <div className="mt-10 flex gap-3">

        <ChoiceButton
          selected={hasEmi}
          onClick={() =>
            setHasEmi(true)
          }
        >
          Yes
        </ChoiceButton>

        <ChoiceButton
          selected={!hasEmi}
          onClick={() =>
            setHasEmi(false)
          }
        >
          No
        </ChoiceButton>

      </div>

      {hasEmi && (
        <div className="mt-8 max-w-xl">
          <MoneyInput
            label="Monthly EMI"
            description="Add the total amount you pay toward EMIs or loans each month."
            symbol={currencySymbol}
            value={monthlyEmi}
            setValue={
              setMonthlyEmi
            }
          />
        </div>
      )}
    </div>
  );
}

function StepFunds({
  currencySymbol,
  currentSavings,
  setCurrentSavings,
  hasEmergencyFund,
  setHasEmergencyFund,
  emergencyFund,
  setEmergencyFund,
  monthlyInvestments,
  setMonthlyInvestments,
}: {
  currencySymbol: string;
  currentSavings: string;
  setCurrentSavings: (
    value: string
  ) => void;
  hasEmergencyFund: boolean;
  setHasEmergencyFund: (
    value: boolean
  ) => void;
  emergencyFund: string;
  setEmergencyFund: (
    value: string
  ) => void;
  monthlyInvestments: string;
  setMonthlyInvestments: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 5"
        title="Where do you stand today?"
        description="Existing savings and investments will affect the recommendations we give you."
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">

        <MoneyInput
          label="Current savings"
          description="Approximate money you currently have saved."
          symbol={currencySymbol}
          value={currentSavings}
          setValue={
            setCurrentSavings
          }
        />

        <MoneyInput
          label="Current monthly investments"
          description="How much you already contribute toward investments each month."
          symbol={currencySymbol}
          value={monthlyInvestments}
          setValue={
            setMonthlyInvestments
          }
        />

      </div>

      <div className="mt-8 rounded-3xl border border-[#e7e5df] bg-[#fafaf8] p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="font-medium">
              Do you already have an emergency fund?
            </p>

            <p className="mt-1 text-sm text-[#77776f]">
              This helps us avoid recommending
              unnecessary duplicate savings.
            </p>
          </div>

          <div className="flex gap-2">

            <ChoiceButton
              selected={
                hasEmergencyFund
              }
              onClick={() =>
                setHasEmergencyFund(
                  true
                )
              }
            >
              Yes
            </ChoiceButton>

            <ChoiceButton
              selected={
                !hasEmergencyFund
              }
              onClick={() =>
                setHasEmergencyFund(
                  false
                )
              }
            >
              No
            </ChoiceButton>

          </div>

        </div>

        {hasEmergencyFund && (
          <div className="mt-6">
            <MoneyInput
              label="Emergency fund amount"
              description="Approximate amount currently set aside specifically for emergencies."
              symbol={currencySymbol}
              value={emergencyFund}
              setValue={
                setEmergencyFund
              }
            />
          </div>
        )}

      </div>
    </div>
  );
}

function StepGoals({
  selectedGoals,
  toggleGoal,
}: {
  selectedGoals: string[];
  toggleGoal: (
    goal: string
  ) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Final step"
        title="What are you planning for?"
        description="Choose anything that matters to you. You can add and change goals later."
      />

      <div className="mt-10 grid gap-3 sm:grid-cols-2">

        {goals.map((goal) => {
          const selected =
            selectedGoals.includes(
              goal
            );

          return (
            <button
              key={goal}
              type="button"
              onClick={() =>
                toggleGoal(goal)
              }
              className={`rounded-2xl border p-4 text-left text-sm font-medium transition ${
                selected
                  ? "border-[#1f5c4a] bg-[#edf5f1] text-[#173d32]"
                  : "border-[#e5e3dd] bg-[#fafaf8] hover:border-[#bcbcb4]"
              }`}
            >
              <span className="mr-2">
                {selected
                  ? "✓"
                  : "○"}
              </span>

              {goal}
            </button>
          );
        })}

      </div>
    </div>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-[#1f5c4a]">
        {eyebrow}
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 text-sm leading-7 text-[#6f7069] sm:text-base">
        {description}
      </p>
    </div>
  );
}

function MoneyInput({
  label,
  description,
  symbol,
  value,
  setValue,
}: {
  label: string;
  description: string;
  symbol: string;
  value: string;
  setValue: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <p className="mb-3 text-xs leading-5 text-[#85857e]">
        {description}
      </p>

      <div className="flex overflow-hidden rounded-2xl border border-[#deddd7] bg-[#fafaf8] focus-within:border-[#1f5c4a] focus-within:ring-4 focus-within:ring-[#1f5c4a]/10">
        <div className="flex items-center px-4 text-sm text-[#77776f]">
          {symbol}
        </div>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(event) =>
            setValue(
              event.target.value
            )
          }
          placeholder="0"
          className="w-full bg-transparent px-3 py-3.5 outline-none"
        />
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
        selected
          ? "bg-[#173d32] text-white"
          : "border border-[#deddd7] bg-white text-[#55554f] hover:bg-[#f5f4f0]"
      }`}
    >
      {children}
    </button>
  );
}