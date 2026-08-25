import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, userIdentifier } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Platform backend is not configured yet." },
        { status: 503 }
      );
    }

    // 1. Fetch application record to verify existence and check status
    const { data: application, error: fetchError } = await admin
      .from("applications")
      .select("id, status, user_id, submitted_by, applicant")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application record not found." },
        { status: 404 }
      );
    }

    // 2. Ownership Check: Ensure request matches the applicant ID, email, or phone
    if (userIdentifier) {
      const applicantData = application.applicant || {};
      const isOwner =
        application.user_id === userIdentifier ||
        application.submitted_by === userIdentifier ||
        applicantData.email === userIdentifier ||
        applicantData.phoneNumber === userIdentifier;

      if (!isOwner) {
        return NextResponse.json(
          { error: "You do not have permission to withdraw this application." },
          { status: 403 }
        );
      }
    }

    // 3. Enforce status rule: allow withdrawal only for 'pending' or 'under_review'
    const withdrawableStatuses = ["pending", "under_review"];
    if (!withdrawableStatuses.includes(application.status)) {
      return NextResponse.json(
        {
          error: `Cannot withdraw application once status is '${application.status}'. Please contact support.`,
        },
        { status: 400 }
      );
    }

    // 4. Mark application as withdrawn
    const { error: updateError } = await admin
      .from("applications")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // 5. Log activity event to the events table
    const activeUserId = userIdentifier || application.user_id || application.submitted_by;
    if (activeUserId) {
      await admin.from("events").insert({
        type: "application.withdrawn",
        user_id: activeUserId,
        actor: activeUserId,
        details: { applicationId },
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Application successfully withdrawn.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal server error occurred.",
      },
      { status: 500 }
    );
  }
}