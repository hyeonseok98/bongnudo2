import { describe, expect, it } from "vitest";

import { buildSyncPlan, getDeleteSafetyWarnings } from "../../tools/bongnudo2-sync-plan.mjs";

interface Person {
  name: string;
  chzzkChannelId: string;
  rpName: string | null;
  profileImageKey: string | null;
  primaryOrganization: string | null;
  affiliations: Affiliation[];
  roleHistories: RoleHistory[];
}

interface Affiliation {
  name: string;
  type: "mcn" | "group";
  slug: string;
  sortOrder: number;
}

interface StreamerAffiliationMaster {
  name: string;
  type: "mcn" | "group";
  slug: string;
  parentName: string | null;
  isFilterVisible: boolean;
  isQuickFilter: boolean;
  quickFilterLabel: string | null;
  filterOrder: number;
}

interface RoleHistory {
  slot: number;
  organization: string;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  isLeader: boolean;
}

interface Organization {
  name: string;
  category: string;
  slug: string;
  type: string;
}

interface Recruitment {
  key: string;
  organization: string;
  title: string;
  type: string;
  round: number;
  status: string;
  notes: string | null;
}

interface Application {
  recruitmentKey: string;
  personName: string;
  interviewSessionKey: string | null;
  interviewOrder: number | null;
  result: string;
  roleAfterPass: string | null;
  notes: string | null;
}

interface ExcelData {
  people: Person[];
  streamerAffiliations: StreamerAffiliationMaster[];
  organizations: Organization[];
  recruitments: Recruitment[];
  interviews: unknown[];
  applications: Application[];
}

function makeExcel(
  personOverrides: Partial<Person> = {},
  organizationRows: Organization[] = [{
    name: "공무직 조직",
    category: "공무직",
    slug: "public",
    type: "institution",
  }],
): ExcelData {
  return {
    people: [{
      name: "테스트",
      chzzkChannelId: "channel",
      rpName: null,
      profileImageKey: null,
      primaryOrganization: "공무직 조직",
      affiliations: [{ name: "알파", type: "mcn", slug: "mcn-alpha", sortOrder: 1 }],
      roleHistories: [{ slot: 1, organization: "공무직 조직", role: null, startDate: null, endDate: null, isLeader: false }],
      ...personOverrides,
    }],
    streamerAffiliations: [{
      name: "알파",
      type: "mcn",
      slug: "mcn-alpha",
      parentName: null,
      isFilterVisible: true,
      isQuickFilter: false,
      quickFilterLabel: null,
      filterOrder: 1,
    }],
    organizations: organizationRows,
    recruitments: [],
    interviews: [],
    applications: [],
  };
}

function makeContext(
  excel: ExcelData,
  overrides: Record<string, unknown> = {},
) {
  return {
    season: { id: 2 },
    people: [{
      person: excel.people[0],
      streamer: { id: "streamer", name: "테스트", chzzk_channel_id: "channel", profile_image_key: null },
      participant: { id: "participant", streamer_id: "streamer", rp_name: null },
    }],
    streamers: [],
    participants: [],
    organizations: [{ id: "organization", name: "공무직 조직", slug: "public", type: "institution" }],
    affiliations: [{
      id: "affiliation",
      name: "알파",
      type: "mcn",
      slug: "mcn-alpha",
      parent_affiliation_id: null,
      is_filter_visible: true,
      is_quick_filter: false,
      quick_filter_label: null,
      filter_order: 1,
    }],
    affiliationMemberships: [{ id: "affiliation-membership", streamer_id: "streamer", affiliation_id: "affiliation", sort_order: 1 }],
    organizationMemberships: [{ id: "organization-membership", participant_id: "participant", organization_id: "organization", role: null, joined_at: null, left_at: null, is_primary: true, display_order: 1 }],
    histories: [{ id: "history", membership_id: "organization-membership", role: null, start_date: null, end_date: null, is_leader: false }],
    jobs: [{ id: "job", slug: "public-job-public", name: "공무직 조직" }],
    recruitments: [],
    sessions: [],
    applications: [],
    ...overrides,
  };
}

describe("buildSyncPlan", () => {
  it("동일한 nullable role history를 유지로 판단함", () => {
    const excel = makeExcel();
    const plan = buildSyncPlan(excel, makeContext(excel));
    expect(plan.sections.roleHistories.unchanged).toHaveLength(1);
    expect(plan.sections.roleHistories.create).toHaveLength(0);
    expect(plan.sections.roleHistories.delete).toHaveLength(0);
  });

  it("MCN 추가와 삭제를 affiliation 및 membership diff로 계산함", () => {
    const addExcel = makeExcel({ affiliations: [
      { name: "알파", type: "mcn", slug: "mcn-alpha", sortOrder: 1 },
      { name: "베타", type: "mcn", slug: "mcn-beta", sortOrder: 2 },
    ] });
    addExcel.streamerAffiliations.push({
      name: "베타",
      type: "mcn",
      slug: "mcn-beta",
      parentName: null,
      isFilterVisible: true,
      isQuickFilter: false,
      quickFilterLabel: null,
      filterOrder: 2,
    });
    const addPlan = buildSyncPlan(addExcel, makeContext(addExcel));
    expect(addPlan.sections.affiliations.create).toHaveLength(1);
    expect(addPlan.sections.affiliationMemberships.create).toHaveLength(1);

    const removeExcel = makeExcel({ affiliations: [] });
    removeExcel.streamerAffiliations = [];
    const removePlan = buildSyncPlan(removeExcel, makeContext(removeExcel));
    expect(removePlan.sections.affiliationMemberships.delete).toHaveLength(1);
    expect(removePlan.sections.affiliations.delete).toHaveLength(1);
  });

  it("소속 마스터 필터 속성 변경을 update로 계산함", () => {
    const excel = makeExcel();
    excel.streamerAffiliations[0].isQuickFilter = true;
    excel.streamerAffiliations[0].quickFilterLabel = "알파";

    const plan = buildSyncPlan(excel, makeContext(excel));

    expect(plan.sections.affiliations.update).toHaveLength(1);
  });

  it("RP 이름과 role 변경을 별도 diff로 계산함", () => {
    const excel = makeExcel({
      rpName: "새 RP",
      roleHistories: [{ slot: 1, organization: "공무직 조직", role: "팀장", startDate: null, endDate: null, isLeader: false }],
    });
    const plan = buildSyncPlan(excel, makeContext(excel));
    expect(plan.sections.people.update).toHaveLength(1);
    expect(plan.sections.roleHistories.create).toHaveLength(1);
    expect(plan.sections.roleHistories.delete).toHaveLength(1);
  });

  it("면접 결과 변경을 지원 현황 수정으로 계산함", () => {
    const excel = makeExcel();
    excel.recruitments = [{ key: "recruitment", organization: "공무직 조직", title: "모집", type: "initial", round: 1, status: "closed", notes: null }];
    excel.applications = [{ recruitmentKey: "recruitment", personName: "테스트", interviewSessionKey: null, interviewOrder: null, result: "passed", roleAfterPass: null, notes: null }];
    const plan = buildSyncPlan(excel, makeContext(excel, {
      recruitments: [{ id: "recruitment-id", recruitment_key: "recruitment", job_id: "job", target_organization_id: "organization", title: "모집", recruitment_type: "initial", round: 1, status: "closed", notes: null }],
      applications: [{ id: "application", participant_id: "participant", recruitment_id: "recruitment-id", session_id: null, result: "pending", interview_order: null, role_after_pass: null, notes: null }],
    }));
    expect(plan.sections.applications.update).toHaveLength(1);
  });

  it("공무직 category만 public job desired state에 포함함", () => {
    const excel = makeExcel({}, [
      { name: "공무직 조직", category: "공무직", slug: "public", type: "institution" },
      { name: "사업체", category: "사업체", slug: "business", type: "business" },
    ]);
    const plan = buildSyncPlan(excel, makeContext(excel, {
      jobs: [
        { id: "job", slug: "public-job-public", name: "공무직 조직" },
        { id: "old-job", slug: "public-job-business", name: "사업체" },
      ],
    }));
    expect(plan.sections.publicJobs.unchanged).toHaveLength(1);
    expect(plan.sections.publicJobs.delete).toHaveLength(1);
  });

  it("20건 이상 삭제를 force 대상 경고로 계산함", () => {
    const warnings = getDeleteSafetyWarnings({
      sections: { affiliationMemberships: { delete: Array.from({ length: 20 }), currentCount: 100 } },
    });
    expect(warnings).toHaveLength(1);
  });
});
