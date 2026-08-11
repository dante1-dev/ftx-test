import { NextResponse, type NextRequest } from "next/server";
import { validateApplicationPayload, PRODUCTS } from "@/lib/kyc";
import { getClientIp, lookupIpGeo } from "@/lib/geo";
import { createAdminClient, logEvent } from "@/lib/admin";
import { createClientProxy, isSupabaseConfigured } from "@/lib/supabase";

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

  const applicant: Record<string, unknown> = {
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: body.dateOfBirth,
    gender: body.gender,
    nin: body.nin ?? null,
    phoneNumber: body.phoneNumber,
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

  // Resolve the submitting user (if a session cookie exists)
  const response = NextResponse.next();
  const supabase = createClientProxy(request, response);
  let submittedBy: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    submittedBy = user?.id ?? null;
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
