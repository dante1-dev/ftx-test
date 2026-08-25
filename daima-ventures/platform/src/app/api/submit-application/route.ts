import { NextResponse, type NextRequest } from "next/server";
import { validateApplicationPayload, PRODUCTS } from "@/lib/kyc";
import { getClientIp, lookupIpGeo } from "@/lib/geo";
import { createAdminClient, logEvent } from "@/lib/admin";
import { createClientProxy, isSupabaseConfigured } from "@/lib/supabase";

const BLOCKING_STATUSES = ["pending", "under_review", "approved", "active", "disbursed"];

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "The platform backend is not configured yet. Please set your Supabase environment variables." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "The platform backend is not configured yet." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const errors = validateApplicationPayload(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const ip = getClientIp(request);
  const geo = await lookupIpGeo(ip);

  const productKey = String(body.product);
  const cfg = PRODUCTS[productKey];
  const loanAmount = Number(String(body.loanAmount).replace(/[^0-9]/g, ""));
  const loanPurpose = String(body.loanPurpose ?? cfg?.purpose ?? "");

  const phoneNumber = String(body.phoneNumber ?? "").trim();
  const nin = String(body.nin ?? "").trim();

  const applicant: Record<string, unknown> = {
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: body.dateOfBirth,
    gender: body.gender,
    nin: nin || null,
    phoneNumber,
    email: body.email ?? null,
    primaryCrop: body.primaryCrop ?? null,
    farmSize: body.farmSize ?? null,
    annualProduction: body.annualProduction ?? null,
    farmingExperience: body.farmingExperience ?? null,
    otherCrop: body.otherCrop ?? null,
    cooperativeName: body.cooperativeName ?? null,
    membershipNumber: body.membershipNumber ?? null,
    position: body.position ?? null,
    registrationNumber: body.registrationNumber ?? null,
    monthlyIncome: body.monthlyIncome ?? null,
    bankAccount: body.bankAccount ?? null,
    consents: {
      dataConsent: Boolean(body.dataConsent),
      creditCheck: Boolean(body.creditCheck),
      termsAccept: Boolean(body.termsAccept),
      accurateInfo: Boolean(body.accurateInfo),
    },
  };

  // Resolve logged-in user if available
  const response = NextResponse.next();
  const supabase = createClientProxy(request, response);
  let submittedBy: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    submittedBy = user?.id ?? null;
  }

  // Build channel-agnostic active application query (Phone, NIN, or User Account)
  const conditions: string[] = [];
  if (phoneNumber) {
    conditions.push(`applicant->>phoneNumber.eq.${phoneNumber}`);
  }
  if (nin) {
    conditions.push(`applicant->>nin.eq.${nin}`);
  }
  if (submittedBy) {
    conditions.push(`user_id.eq.${submittedBy}`);
    conditions.push(`submitted_by.eq.${submittedBy}`);
  }

  if (conditions.length > 0) {
    const { data: existingApps } = await admin
      .from("applications")
      .select("id, status")
      .or(conditions.join(","))
      .in("status", BLOCKING_STATUSES)
      .limit(1);

    if (existingApps && existingApps.length > 0) {
      return NextResponse.json(
        {
          error:
            "An active application or loan already exists for this phone number, NIN, or user account. You can apply again once your current cycle is completed.",
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await admin
    .from("applications")
    .insert({
      product: productKey,
      loan_amount: loanAmount,
      loan_purpose: loanPurpose,
      applicant,
      region: String(body.region ?? ""),
      district: String(body.district ?? ""),
      subcounty: String(body.subcounty ?? ""),
      village: String(body.village ?? ""),
      ip_address: ip,
      geo,
      submitted_by: submittedBy,
      user_id: submittedBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not save your application. Please try again later." },
      { status: 500 },
    );
  }

  await logEvent({
    type: "application.submitted",
    actor: submittedBy,
    payload: {
      applicationId: data.id,
      product: productKey,
      loanAmount,
      region: body.region,
    },
    ip,
    geo,
  });

  return NextResponse.json({ ok: true, id: data.id });
}