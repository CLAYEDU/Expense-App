"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Check } from "lucide-react";

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
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<Country | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>("monthly");
  const [essentialExpenses, setEssentialExpenses] = useState("");
  const [recurringExpenses, setRecurringExpenses] = useState("");
  const [hasEmi, setHasEmi] = useState(false);
  const [monthlyEmi, setMonthlyEmi] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [hasEmergencyFund, setHasEmergencyFund] = useState(false);
  const [emergencyFund, setEmergencyFund] = useState("");
  const [monthlyInvestments, setMonthlyInvestments] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const currency: Currency = country === "AE" ? "AED" : "INR";
  const currencySymbol = currency === "AED" ? "د.إ" : "₹";

  const progress = useMemo(() => (step / 6) * 100, [step]);

  function toggleGoal(goal: string) {
    setSelectedGoals((current) =>
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    );
  }

  function nextStep() {
    setError("");

    if (step === 1 && !country) {
      setError("Please choose your country.");
      return;
    }

    if (step === 2 && Number(monthlyIncome) <= 0) {
      setError("Please enter your regular income.");
      return;
    }

    if (step === 3 && Number(essentialExpenses) < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (step === 4 && hasEmi && Number(monthlyEmi) <= 0) {
      setError("Please enter your monthly EMI.");
      return;
    }

    if (step === 5 && Number(currentSavings) < 0) {
      setError("Please enter a valid savings amount.");
      return;
    }

    if (step < 6) {
      setStep((current) => current + 1);
    }
  }

  function previousStep() {
    setError("");
    if (step > 1) {
      setStep((current) => current - 1);
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
        monthlyEmi: hasEmi ? Number(monthlyEmi) || 0 : 0,
        currentSavings: Number(currentSavings) || 0,
        emergencyFund: hasEmergencyFund ? Number(emergencyFund) || 0 : 0,
        monthlyInvestments: Number(monthlyInvestments) || 0,
        hasEmi,
        hasEmergencyFund,
        financialGoals: selectedGoals,
        setupCompleted: true,
        monthlySavings: 0,
      };

      await saveFinancialProfile(user.uid, profile);
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("We couldn't save your financial setup. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#173d32] border-t-transparent relative z-10" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#edf2ee] px-5 py-6 sm:px-8 sm:py-10 text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ================= APPLE AMBIENT LIVING AURORA BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/25 blur-[120px]" />
        <div className="absolute top-[25%] -left-36 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[140px]" />
        <div className="absolute -bottom-36 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-t from-cyan-300/35 via-emerald-200/30 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* ================= HEADER ================= */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-neutral-950">
                Finora
              </div>
              <p className="text-[11px] font-semibold text-neutral-500">
                Financial Baseline Setup
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/70 px-3.5 py-1.5 text-xs font-black text-neutral-700 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
            Step {step} of 6
          </div>
        </header>

        {/* Progress Track */}
        <div className="mb-8 h-2 overflow-hidden rounded-full border border-white/80 bg-white/50 p-0.5 shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-sm transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ================= LIQUID GLASS CARD CONTAINER ================= */}
        <section className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
          {step === 1 && (
            <StepCountry country={country} setCountry={setCountry} />
          )}

          {step === 2 && (
            <StepIncome
              currencySymbol={currencySymbol}
              monthlyIncome={monthlyIncome}
              setMonthlyIncome={setMonthlyIncome}
              incomeFrequency={incomeFrequency}
              setIncomeFrequency={setIncomeFrequency}
            />
          )}

          {step === 3 && (
            <StepExpenses
              currencySymbol={currencySymbol}
              essentialExpenses={essentialExpenses}
              setEssentialExpenses={setEssentialExpenses}
              recurringExpenses={recurringExpenses}
              setRecurringExpenses={setRecurringExpenses}
            />
          )}

          {step === 4 && (
            <StepEmi
              currencySymbol={currencySymbol}
              hasEmi={hasEmi}
              setHasEmi={setHasEmi}
              monthlyEmi={monthlyEmi}
              setMonthlyEmi={setMonthlyEmi}
            />
          )}

          {step === 5 && (
            <StepFunds
              currencySymbol={currencySymbol}
              currentSavings={currentSavings}
              setCurrentSavings={setCurrentSavings}
              hasEmergencyFund={hasEmergencyFund}
              setHasEmergencyFund={setHasEmergencyFund}
              emergencyFund={emergencyFund}
              setEmergencyFund={setEmergencyFund}
              monthlyInvestments={monthlyInvestments}
              setMonthlyInvestments={setMonthlyInvestments}
            />
          )}

          {step === 6 && (
            <StepGoals
              selectedGoals={selectedGoals}
              toggleGoal={toggleGoal}
            />
          )}

          {error && (
            <div className="mt-7 rounded-2xl border border-red-300/80 bg-red-50/80 px-4 py-3 text-xs font-bold text-red-700 shadow-sm backdrop-blur-md">
              {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-black/5 pt-6">
            <button
              type="button"
              onClick={previousStep}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 text-xs font-bold text-neutral-700 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition hover:bg-white disabled:invisible active:scale-95"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-6 py-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
              >
                Continue
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishSetup}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-7 py-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {saving ? "Calibrating financial space..." : "Complete Setup"}
                <Check size={16} />
              </button>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-xs font-semibold leading-5 text-neutral-500">
          Your information is stored encrypted and used solely to build your automated runway analytics.
        </p>
      </div>
    </main>
  );
}

// ============================================================================
// STEP SUBCOMPONENTS (Translucent Aqua Glass)
// ============================================================================

function StepCountry({
  country,
  setCountry,
}: {
  country: Country | null;
  setCountry: (country: Country) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 1"
        title="Where do you live?"
        description="Select your primary jurisdiction to establish localized taxation context, currency format, and regulatory guidance."
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <CountryCard
          selected={country === "IN"}
          onClick={() => setCountry("IN")}
          flag="🇮🇳"
          title="India"
          subtitle="Indian Rupee • INR ₹"
        />

        <CountryCard
          selected={country === "AE"}
          onClick={() => setCountry("AE")}
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
      className={`rounded-[28px] border p-6 text-left transition-all duration-300 ${
        selected
          ? "border-emerald-500 bg-white/90 shadow-[0_16px_36px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-4 ring-emerald-500/20 backdrop-blur-2xl"
          : "border-white/80 bg-white/45 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl hover:border-white hover:bg-white/65 hover:scale-[1.02]"
      }`}
    >
      <div className="text-4xl">{flag}</div>
      <div className="mt-4 font-black text-neutral-900">{title}</div>
      <div className="mt-0.5 text-xs font-semibold text-neutral-500">
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
  setMonthlyIncome: (value: string) => void;
  incomeFrequency: IncomeFrequency;
  setIncomeFrequency: (value: IncomeFrequency) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 2"
        title="What is your regular income?"
        description="Establish your primary monthly inflow. You can calibrate or adjust this anytime from your dashboard settings."
      />

      <div className="mt-8 max-w-xl space-y-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-600">
            Net Inflow Amount
          </label>
          <div className="flex overflow-hidden rounded-2xl border border-white/90 bg-white/70 shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] backdrop-blur-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
            <div className="flex items-center px-4 text-base font-extrabold text-neutral-400">
              {currencySymbol}
            </div>
            <input
              type="number"
              min="0"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="50,000"
              className="w-full bg-transparent px-3 py-3.5 text-xl font-black text-neutral-900 outline-none placeholder:text-neutral-300"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-600">
            Deposit Frequency
          </label>
          <select
            value={incomeFrequency}
            onChange={(e) => setIncomeFrequency(e.target.value as IncomeFrequency)}
            className="w-full rounded-2xl border border-white/90 bg-white/70 px-4 py-3.5 text-sm font-bold text-neutral-900 shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] backdrop-blur-xl outline-none focus:border-emerald-500"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
            <option value="irregular">Irregular</option>
          </select>
        </div>
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
  setEssentialExpenses: (value: string) => void;
  recurringExpenses: string;
  setRecurringExpenses: (value: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 3"
        title="What does it cost to live each month?"
        description="Estimate essential living costs. Finora refines these figures automatically as actual expenses are logged."
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <MoneyInput
          label="Essential Living Expenses"
          description="Housing, groceries, utilities, transport, and non-negotiables."
          symbol={currencySymbol}
          value={essentialExpenses}
          setValue={setEssentialExpenses}
        />

        <MoneyInput
          label="Other Recurring Commitments"
          description="Subscriptions, memberships, software, and regular overhead."
          symbol={currencySymbol}
          value={recurringExpenses}
          setValue={setRecurringExpenses}
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
  setHasEmi: (value: boolean) => void;
  monthlyEmi: string;
  setMonthlyEmi: (value: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 4"
        title="Do you have an active EMI or loan payment?"
        description="Fixed debt commitments are prioritized by the analytics engine before calculating discretionary runway."
      />

      <div className="mt-8 flex gap-3">
        <ChoiceButton selected={hasEmi} onClick={() => setHasEmi(true)}>
          Yes
        </ChoiceButton>
        <ChoiceButton selected={!hasEmi} onClick={() => setHasEmi(false)}>
          No
        </ChoiceButton>
      </div>

      {hasEmi && (
        <div className="mt-6 max-w-xl">
          <MoneyInput
            label="Total Monthly EMI / Debt Service"
            description="Combined monthly payments across mortgages, auto loans, and personal financing."
            symbol={currencySymbol}
            value={monthlyEmi}
            setValue={setMonthlyEmi}
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
  setCurrentSavings: (value: string) => void;
  hasEmergencyFund: boolean;
  setHasEmergencyFund: (value: boolean) => void;
  emergencyFund: string;
  setEmergencyFund: (value: string) => void;
  monthlyInvestments: string;
  setMonthlyInvestments: (value: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 5"
        title="Where do you stand today?"
        description="Existing reserves and investment contributions calibrate your safety buffer calculations."
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <MoneyInput
          label="Liquid Savings"
          description="Readily accessible funds held in primary checking or high-yield savings."
          symbol={currencySymbol}
          value={currentSavings}
          setValue={setCurrentSavings}
        />

        <MoneyInput
          label="Monthly Investment Flow"
          description="Systematic investment plans (SIP), market contributions, or retirement funds."
          symbol={currencySymbol}
          value={monthlyInvestments}
          setValue={setMonthlyInvestments}
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-[28px] border border-white/80 bg-white/50 p-6 shadow-[0_12px_28px_rgba(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-neutral-900">
              Do you have a dedicated emergency fund?
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Helps prevent double-counting liquid reserves against safety target recommendations.
            </p>
          </div>

          <div className="flex gap-2">
            <ChoiceButton
              selected={hasEmergencyFund}
              onClick={() => setHasEmergencyFund(true)}
            >
              Yes
            </ChoiceButton>
            <ChoiceButton
              selected={!hasEmergencyFund}
              onClick={() => setHasEmergencyFund(false)}
            >
              No
            </ChoiceButton>
          </div>
        </div>

        {hasEmergencyFund && (
          <div className="mt-6 border-t border-black/5 pt-5">
            <MoneyInput
              label="Dedicated Emergency Fund Value"
              description="Capital explicitly earmarked for unexpected emergencies."
              symbol={currencySymbol}
              value={emergencyFund}
              setValue={setEmergencyFund}
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
  toggleGoal: (goal: string) => void;
}) {
  return (
    <div>
      <StepHeading
        eyebrow="Step 6"
        title="What are you planning for?"
        description="Select your financial milestones to focus recommendation algorithms on your strategic targets."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => {
          const selected = selectedGoals.includes(goal);
          return (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left text-xs font-bold transition-all duration-200 ${
                selected
                  ? "border-emerald-500 bg-white/95 text-emerald-950 shadow-[0_8px_20px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-2 ring-emerald-500/20 backdrop-blur-xl"
                  : "border-white/80 bg-white/45 text-neutral-700 shadow-xs backdrop-blur-md hover:border-white hover:bg-white/70 hover:scale-[1.01]"
              }`}
            >
              <span>{goal}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition ${
                  selected
                    ? "bg-emerald-600 text-white"
                    : "border border-neutral-300 text-transparent"
                }`}
              >
                ✓
              </span>
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
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-0.5 text-[11px] font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
        <Sparkles size={12} className="text-emerald-600 animate-pulse" />
        <span>{eyebrow}</span>
      </div>
      <h1 className="mt-2.5 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-neutral-500">
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
  setValue: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-600">
        {label}
      </label>
      <p className="mb-2 text-[11px] font-semibold text-neutral-400">
        {description}
      </p>
      <div className="flex overflow-hidden rounded-2xl border border-white/90 bg-white/70 shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] backdrop-blur-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
        <div className="flex items-center px-4 text-sm font-extrabold text-neutral-400">
          {symbol}
        </div>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent px-3 py-3 text-sm font-black text-neutral-900 outline-none placeholder:text-neutral-300"
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
      className={`rounded-2xl px-5 py-2 text-xs font-bold transition-all duration-200 ${
        selected
          ? "bg-[#173d32] text-white shadow-[0_8px_20px_rgba(23,61,50,0.25)] scale-105"
          : "border border-white/80 bg-white/60 text-neutral-700 shadow-xs backdrop-blur-md hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}