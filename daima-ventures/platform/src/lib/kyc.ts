export interface ProductConfig {
  min: number;
  max: number;
  label: string;
  purpose: string;
  showAgri: boolean;
  showCoop: boolean;
}

export const PRODUCTS: Record<string, ProductConfig> = {
  harvest_advance: {
    min: 5000000,
    max: 200000000,
    label: "Harvest Advance Loans",
    purpose: "harvest_advance",
    showAgri: true,
    showCoop: false,
  },
  asset_acquisition: {
    min: 5000000,
    max: 500000000,
    label: "Asset Acquisition & Development",
    purpose: "asset_acquisition",
    showAgri: false,
    showCoop: true,
  },
  value_chain: {
    min: 20000000,
    max: 500000000,
    label: "Agricultural Value Chain Loans",
    purpose: "value_chain",
    showAgri: false,
    showCoop: true,
  },
};

export const PRODUCT_OPTIONS: { value: string; label: string }[] = [
  { value: "harvest_advance", label: "Harvest Advance Loans (UGX 5M - 200M)" },
  { value: "asset_acquisition", label: "Asset Acquisition & Development (UGX 5M - 500M)" },
  { value: "value_chain", label: "Agricultural Value Chain Loans (UGX 20M - 500M)" },
];

export const REGION_DISTRICTS: Record<string, string[]> = {
  central: [
    "Kampala", "Wakiso", "Mukono", "Mpigi", "Masaka", "Kayunga", "Luwero",
    "Nakasongola", "Kalangala", "Sembabule", "Bukomansimbi", "Butambala",
    "Gomba", "Kalungu", "Lyantonde",
  ],
  eastern: [
    "Jinja", "Iganga", "Busia", "Tororo", "Mbale", "Soroti", "Kamuli",
    "Bugiri", "Pallisa", "Kapchorwa", "Namayingo", "Bugweri", "Butaleja",
    "Budaka", "Kaliro", "Bukedea", "Sironko", "Kaberamaido", "Ngora", "Serere",
  ],
  northern: [
    "Gulu", "Lira", "Kitgum", "Pader", "Apac", "Nwoya", "Amuru", "Lamwo",
    "Moroto", "Nakapiripirit", "Amolatar", "Kole", "Oyam", "Dokolo", "Abim",
    "Napak", "Otuke", "Karenga", "Kaabong", "Kotido", "Amudat",
  ],
  western: [
    "Mbarara", "Kasese", "Bushenyi", "Kabale", "Rukungiri", "Kanungu",
    "Ntungamo", "Ibanda", "Kamwenge", "Kabarole", "Rubirizi", "Bundibugyo",
    "Kyejojo", "Buhweju", "Rukiga", "Ntoroko", "Kisoro",
  ],
};

export function formatCurrency(raw: string): string {
  const s = raw.replace(/[^0-9]/g, "");
  if (!s) return "";
  const n = Number(s);
  if (Number.isNaN(n) || n > 999999999999) return raw;
  return n.toLocaleString("en-US");
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-]/g, "");
}

export function validatePhone(raw: string): boolean {
  const c = normalizePhone(raw);
  if (!c) return false;
  return /^\+256\d{9,10}$/.test(c);
}

export function validateEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function validateNIN(v: string): boolean {
  return /^[A-Za-z0-9]{14}$/.test(v);
}

export function validateDOB(
  v: string,
): { ok: boolean; message: string } | null {
  if (!v) return null;
  const bd = new Date(v);
  if (Number.isNaN(bd.getTime())) {
    return { ok: false, message: "Enter a valid date of birth." };
  }
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
  if (age < 18 || age > 120) {
    return { ok: false, message: "Age must be between 18 and 120 years." };
  }
  return { ok: true, message: "" };
}

export function validateFarmSize(
  v: string,
): { ok: boolean; message: string } | null {
  if (!v) return null;
  const sz = Number.parseFloat(v);
  if (Number.isNaN(sz) || sz <= 0 || sz > 50000) {
    return {
      ok: false,
      message: "Farm size must be between 0.1 and 50,000 acres.",
    };
  }
  return { ok: true, message: "" };
}

export function validateLoanAmount(
  value: string,
  productKey: string,
): { ok: boolean; message: string } {
  if (!value.trim()) return { ok: true, message: "" };
  const amount = Number(value.replace(/[^0-9]/g, ""));
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, message: "Please enter a valid loan amount." };
  }
  const cfg = PRODUCTS[productKey];
  if (!cfg) {
    return {
      ok: false,
      message: "Please select a product first to see allowed loan limits.",
    };
  }
  if (amount < cfg.min || amount > cfg.max) {
    return {
      ok: false,
      message: `Amount must be UGX ${cfg.min.toLocaleString()} - ${cfg.max.toLocaleString()} for ${cfg.label}. Please adjust your request or choose a different product.`,
    };
  }
  return { ok: true, message: "" };
}

export function validateApplicationPayload(
  d: Record<string, unknown>,
): Record<string, string> {
  const e: Record<string, string> = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const req = (field: string, label: string, value: unknown) => {
    if (!str(value)) e[field] = `${label} is required.`;
  };

  req("firstName", "First Name", d.firstName);
  req("lastName", "Last Name", d.lastName);
  req("gender", "Gender", d.gender);
  req("region", "Region", d.region);
  req("district", "District", d.district);
  req("subcounty", "Sub-county", d.subcounty);
  req("village", "Village", d.village);

  const dob = validateDOB(str(d.dateOfBirth));
  if (dob && !dob.ok) e.dateOfBirth = dob.message;

  const phone = str(d.phoneNumber);
  if (phone && !validatePhone(phone)) {
    e.phoneNumber =
      "Enter a valid Ugandan number (+2567XXXXXXXX or +256XXXXXXXXX).";
  }
  const email = str(d.email);
  if (email && !validateEmail(email)) {
    e.email = "Please enter a valid email address.";
  }
  const nin = str(d.nin);
  if (nin && !validateNIN(nin)) {
    e.nin = "NIN must be exactly 14 alphanumeric characters.";
  }

  const productKey = str(d.product);
  if (!PRODUCTS[productKey]) {
    e.product = "Please choose a product.";
  } else {
    const cfg = PRODUCTS[productKey];
    if (cfg.showAgri) {
      const crop = str(d.primaryCrop);
      req("primaryCrop", "Primary Crop", crop);
      if (crop === "other" && !str(d.otherCrop)) {
        e.otherCrop = "Please specify the other crop.";
      }
      if (!str(d.farmSize)) {
        e.farmSize = "Farm Size is required.";
      } else {
        const fs = validateFarmSize(str(d.farmSize));
        if (fs && !fs.ok) e.farmSize = fs.message;
      }
    }
    if (cfg.showCoop) {
      req("cooperativeName", "Cooperative/Group Name", d.cooperativeName);
    }
    if (!str(d.loanAmount)) {
      e.loanAmount = "Requested Loan Amount is required.";
    } else {
      const la = validateLoanAmount(str(d.loanAmount), productKey);
      if (!la.ok) e.loanAmount = la.message;
    }
  }

  if (d.bankAccount !== "yes" && d.bankAccount !== "no") {
    e.bankAccount = "Please select whether you have a bank account.";
  }

  for (const c of ["dataConsent", "creditCheck", "termsAccept", "accurateInfo"]) {
    if (!d[c]) {
      e[c] = "This consent is required to process your application.";
    }
  }

  return e;
}
