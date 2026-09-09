import { createHash } from "node:crypto";

import ExcelJS from "exceljs";

const EXPECTED_PERSON_HEADERS = [
  "이름",
  "팀(크루)",
  "MCN, 회사",
  "RP 이름",
  "대표 RP 소속",
  "chzzk_url",
  "profile_image_key",
  "모집 구분",
];

const EXPECTED_STREAMER_AFFILIATION_HEADERS = [
  "소속명",
  "유형",
  "상위 소속",
  "필터 노출",
  "빠른 선택",
  "빠른 선택 표시명",
  "표시 순서",
  "비고",
  "관계 출처",
];

const ORGANIZATION_TYPE_BY_CATEGORY = {
  공무직: "institution",
  사업체: "business",
  불법사업체: "illegal-business",
  갱단: "gang",
  크루: "crew",
};

const RECRUITMENT_TYPE_BY_LABEL = {
  "최초 모집": "initial",
  "추가 모집": "additional",
  기타: "other",
};

const RECRUITMENT_STATUS_BY_LABEL = {
  예정: "scheduled",
  진행중: "in_progress",
  종료: "closed",
  취소: "cancelled",
};

const APPLICATION_RESULT_BY_LABEL = {
  미정: "pending",
  합격: "passed",
  불합격: "failed",
  포기: "withdrawn",
  노쇼: "no_show",
};

export async function readBongnudo2Excel(workbookPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const personRows = readRows(workbook, "인물");
  const streamerAffiliationRows = readRows(workbook, "스트리머소속");
  const organizationRows = readRows(workbook, "조직목록");
  const recruitmentRows = readRows(workbook, "공무직채용");
  const interviewRows = readRows(workbook, "면접일정");
  const applicationRows = readRows(workbook, "지원현황").rows.filter(
    (row) =>
      toText(row["recruitment_key"]) ||
      toText(row["이름"]) ||
      toText(row["interview_session_key"]),
  );

  validateHeaders(personRows.headers, EXPECTED_PERSON_HEADERS, "인물");
  validateHeaders(
    streamerAffiliationRows.headers,
    EXPECTED_STREAMER_AFFILIATION_HEADERS,
    "스트리머소속",
  );

  const streamerAffiliations = streamerAffiliationRows.rows.map(
    normalizeStreamerAffiliation,
  );
  const organizations = organizationRows.rows.map((row) => ({
    row: row.__row,
    name: toText(row.organization),
    category: toText(row.category),
    slug: toText(row["organization_key (선택)"]),
  }));

  const organizationNames = new Set(
    organizations.map((organization) => organization.name),
  );
  const people = personRows.rows.map((row) =>
    normalizePerson(row, organizationNames),
  );
  const recruitments = recruitmentRows.rows.map(normalizeRecruitment);
  const interviews = interviewRows.rows.map(normalizeInterview);
  const applications = applicationRows.map(normalizeApplication);

  const errors = validateWorkbook({
    people,
    streamerAffiliations,
    organizations,
    recruitments,
    interviews,
    applications,
  });

  if (errors.length > 0) {
    const preview = errors
      .slice(0, 30)
      .map(
        (error) =>
          `${error.sheet} ${error.row}행: ${error.message}${
            error.value ? ` (${error.value})` : ""
          }`,
      )
      .join("\n");

    throw new Error(
      `Excel 검증 실패: ${errors.length}건\n${preview}${
        errors.length > 30 ? "\n..." : ""
      }`,
    );
  }

  return {
    people,
    streamerAffiliations: streamerAffiliations.map((affiliation) => ({
      ...affiliation,
      slug: createStableSlug(affiliation.type, affiliation.name),
    })),
    organizations: organizations.map((organization) => ({
      ...organization,
      slug:
        organization.slug ||
        createStableSlug("organization", organization.name),
      type: ORGANIZATION_TYPE_BY_CATEGORY[organization.category],
    })),
    recruitments,
    interviews,
    applications,
    summary: buildSummary({
      people,
      streamerAffiliations,
      organizations,
      recruitments,
      interviews,
      applications,
    }),
  };
}

export function createStableSlug(prefix, name) {
  const normalized = name.normalize("NFKD");
  const isAscii = /^[\x00-\x7F]+$/.test(normalized);
  const readable = normalized
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (isAscii && readable) {
    return `${prefix}-${readable}`;
  }

  const digest = createHash("sha256").update(name).digest("hex").slice(0, 12);
  return `${prefix}-${digest}`;
}

function readRows(workbook, sheetName) {
  const sheet = workbook.getWorksheet(sheetName);

  if (!sheet) {
    throw new Error(`${sheetName} 시트를 찾지 못함.`);
  }

  const headers = getRowValues(sheet.getRow(1)).map((value) => toText(value));
  const rows = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const values = getRowValues(sheet.getRow(rowNumber));
    const row = { __row: rowNumber };

    for (const [index, header] of headers.entries()) {
      if (header) {
        row[header] = values[index] ?? null;
      }
    }

    if (
      headers.some(
        (header) =>
          header && row[header] !== null && toText(row[header]) !== "",
      )
    ) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

function getRowValues(row) {
  const values = [];
  for (let column = 1; column <= row.cellCount; column += 1) {
    values.push(normalizeCellValue(row.getCell(column).value));
  }
  return values;
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }

  if (typeof value === "object") {
    if ("result" in value) {
      return normalizeCellValue(value.result);
    }
    if ("richText" in value) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value) {
      return value.text;
    }
    if ("hyperlink" in value) {
      return value.hyperlink;
    }
  }

  return value;
}

function normalizeStreamerAffiliation(row) {
  return {
    row: row.__row,
    name: toText(row["소속명"]),
    type: toText(row["유형"]).toLowerCase(),
    parentName: toText(row["상위 소속"]) || null,
    isFilterVisible: toBooleanValue(row["필터 노출"]),
    isQuickFilter: toBooleanValue(row["빠른 선택"]),
    quickFilterLabel: toText(row["빠른 선택 표시명"]) || null,
    filterOrder: toPositiveInteger(row["표시 순서"]),
    notes: toText(row["비고"]) || null,
    relationSource: toText(row["관계 출처"]) || null,
  };
}

function normalizePerson(row, organizationNames) {
  const affiliations = [
    ...splitValues(row["MCN, 회사"]).map((name, index) => ({
      name,
      type: "mcn",
      sortOrder: index + 1,
      slug: createStableSlug("mcn", name),
    })),
    ...splitValues(row["팀(크루)"]).map((name, index) => ({
      name,
      type: "group",
      sortOrder: index + 1,
      slug: createStableSlug("group", name),
    })),
  ];
  const roleHistories = [];

  for (let slot = 1; slot <= 4; slot += 1) {
    const organization = toText(row[`organization ${slot}`]);
    const role = toText(row[`role ${slot}`]);
    const startDate = toDateText(row[`start_date ${slot}`]);
    const endDate = toDateText(row[`end_date ${slot}`]);
    const leader = toBoolean(row[`leader ${slot}`]);

    if (
      !organization &&
      !role &&
      !startDate &&
      !endDate &&
      leader === false
    ) {
      continue;
    }

    roleHistories.push({
      slot,
      organization,
      role: role || null,
      startDate: startDate || null,
      endDate: endDate || null,
      isLeader: leader,
      isKnownOrganization: organizationNames.has(organization),
    });
  }

  return {
    row: row.__row,
    name: toText(row["이름"]),
    chzzkUrl: toText(row.chzzk_url),
    chzzkChannelId: extractChzzkChannelId(row.chzzk_url),
    rpName: toText(row["RP 이름"]) || null,
    primaryOrganization: toText(row["대표 RP 소속"]) || null,
    profileImageKey: toText(row.profile_image_key) || null,
    admissionCategory: toText(row["모집 구분"]),
    affiliations,
    roleHistories,
  };
}

function normalizeRecruitment(row) {
  return {
    row: row.__row,
    key: toText(row.recruitment_key),
    organization: toText(row["공무직"]),
    type: RECRUITMENT_TYPE_BY_LABEL[toText(row["채용 유형"])] ?? null,
    round: toPositiveInteger(row["회차"]),
    title: toText(row["모집명"]),
    status: RECRUITMENT_STATUS_BY_LABEL[toText(row["상태"])] ?? null,
    notes: toText(row["비고"]) || null,
  };
}

function normalizeInterview(row) {
  const date = toDateText(row["날짜"]);
  const time = toTimeText(row["시작 시간"]);

  return {
    row: row.__row,
    key: toText(row.interview_session_key),
    recruitmentKey: toText(row.recruitment_key),
    round: toPositiveInteger(row["면접 차수"]),
    date,
    time,
    startsAt: date && time ? `${date}T${time}:00+09:00` : null,
    notes: toText(row["비고"]) || null,
  };
}

function normalizeApplication(row) {
  return {
    row: row.__row,
    recruitmentKey: toText(row.recruitment_key),
    personName: toText(row["이름"]),
    interviewSessionKey: toText(row.interview_session_key) || null,
    interviewOrder:
      row["면접 순서"] === null || toText(row["면접 순서"]) === ""
        ? null
        : toPositiveInteger(row["면접 순서"]),
    result: APPLICATION_RESULT_BY_LABEL[toText(row["결과"])] ?? null,
    roleAfterPass: toText(row["합격 후 role"]) || null,
    notes: toText(row["비고"]) || null,
  };
}

function validateWorkbook(data) {
  const errors = [];
  const personNames = new Set(data.people.map((person) => person.name));
  const organizationNames = new Set(
    data.organizations.map((organization) => organization.name),
  );
  const recruitmentKeys = new Set(
    data.recruitments.map((recruitment) => recruitment.key),
  );
  const interviewsByKey = new Map(
    data.interviews.map((interview) => [interview.key, interview]),
  );

  validateUnique(
    data.people,
    (person) => person.name,
    "인물",
    "이름 중복",
    errors,
  );
  validateUnique(
    data.people,
    (person) => person.chzzkChannelId,
    "인물",
    "치지직 채널 ID 중복",
    errors,
  );
  validateUnique(
    data.organizations,
    (organization) => organization.name,
    "조직목록",
    "조직 이름 중복",
    errors,
  );
  validateUnique(
    data.recruitments,
    (recruitment) => recruitment.key,
    "공무직채용",
    "recruitment_key 중복",
    errors,
  );
  validateUnique(
    data.interviews,
    (interview) => interview.key,
    "면접일정",
    "interview_session_key 중복",
    errors,
  );
  validateUnique(
    data.applications,
    (application) =>
      `${application.recruitmentKey}\u0000${application.personName}`,
    "지원현황",
    "같은 인물과 채용의 지원 행 중복",
    errors,
  );
  const affiliationTypesByName = new Map();
  for (const affiliation of data.people.flatMap((person) => person.affiliations)) {
    const types = affiliationTypesByName.get(affiliation.name) ?? new Set();
    types.add(affiliation.type);
    affiliationTypesByName.set(affiliation.name, types);
  }
  for (const [name, types] of affiliationTypesByName) {
    if (types.size > 1) {
      addError(
        errors,
        "인물",
        0,
        "동일 소속 이름을 MCN과 group에 함께 사용할 수 없음",
        name,
      );
    }
  }

  errors.push(
    ...validateStreamerAffiliations(data.people, data.streamerAffiliations),
  );

  for (const person of data.people) {
    if (!person.name) {
      addError(errors, "인물", person.row, "이름 누락");
    }
    if (!person.chzzkChannelId) {
      addError(
        errors,
        "인물",
        person.row,
        "유효한 치지직 채널 URL 누락",
        person.chzzkUrl,
      );
    }

    for (const type of ["mcn", "group"]) {
      const names = person.affiliations
        .filter((affiliation) => affiliation.type === type)
        .map((affiliation) => affiliation.name);
      if (new Set(names).size !== names.length) {
        addError(errors, "인물", person.row, `${type} 소속 중복`);
      }
    }

    const currentOrganizations = new Set();
    for (const history of person.roleHistories) {
      if (!history.organization) {
        addError(
          errors,
          "인물",
          person.row,
          `organization ${history.slot} 없이 경력 세부값 입력`,
        );
        continue;
      }
      if (!history.isKnownOrganization) {
        addError(
          errors,
          "인물",
          person.row,
          `조직목록에 없는 organization ${history.slot}`,
          history.organization,
        );
      }
      if (!isValidDate(history.startDate) || !isValidDate(history.endDate)) {
        addError(
          errors,
          "인물",
          person.row,
          `경력 ${history.slot} 날짜 형식 오류`,
        );
      }
      if (
        history.startDate &&
        history.endDate &&
        history.endDate < history.startDate
      ) {
        addError(
          errors,
          "인물",
          person.row,
          `경력 ${history.slot} 종료일이 시작일보다 빠름`,
        );
      }
      if (!history.endDate) {
        if (currentOrganizations.has(history.organization)) {
          addError(
            errors,
            "인물",
            person.row,
            "동일 조직의 현재 직책이 2개 이상",
            history.organization,
          );
        }
        currentOrganizations.add(history.organization);
      }
    }

    if (
      person.primaryOrganization &&
      !currentOrganizations.has(person.primaryOrganization)
    ) {
      addError(
        errors,
        "인물",
        person.row,
        "대표 RP 소속에 현재 경력이 없음",
        person.primaryOrganization,
      );
    }
  }

  for (const organization of data.organizations) {
    if (!organization.name) {
      addError(errors, "조직목록", organization.row, "조직 이름 누락");
    }
    if (!ORGANIZATION_TYPE_BY_CATEGORY[organization.category]) {
      addError(
        errors,
        "조직목록",
        organization.row,
        "지원하지 않는 조직 category",
        organization.category,
      );
    }
  }

  for (const recruitment of data.recruitments) {
    if (!recruitment.key) {
      addError(errors, "공무직채용", recruitment.row, "recruitment_key 누락");
    }
    if (!organizationNames.has(recruitment.organization)) {
      addError(
        errors,
        "공무직채용",
        recruitment.row,
        "조직목록에 없는 공무직",
        recruitment.organization,
      );
    }
    if (!recruitment.type) {
      addError(errors, "공무직채용", recruitment.row, "채용 유형 오류");
    }
    if (!recruitment.round) {
      addError(errors, "공무직채용", recruitment.row, "회차 오류");
    }
    if (!recruitment.title) {
      addError(errors, "공무직채용", recruitment.row, "모집명 누락");
    }
    if (!recruitment.status) {
      addError(errors, "공무직채용", recruitment.row, "채용 상태 오류");
    }
  }

  for (const interview of data.interviews) {
    if (!interview.key) {
      addError(
        errors,
        "면접일정",
        interview.row,
        "interview_session_key 누락",
      );
    }
    if (!recruitmentKeys.has(interview.recruitmentKey)) {
      addError(
        errors,
        "면접일정",
        interview.row,
        "존재하지 않는 recruitment_key",
        interview.recruitmentKey,
      );
    }
    if (!interview.round) {
      addError(errors, "면접일정", interview.row, "면접 차수 오류");
    }
    if (!interview.startsAt) {
      addError(errors, "면접일정", interview.row, "날짜 또는 시작 시간 오류");
    }
  }

  for (const application of data.applications) {
    if (!recruitmentKeys.has(application.recruitmentKey)) {
      addError(
        errors,
        "지원현황",
        application.row,
        "존재하지 않는 recruitment_key",
        application.recruitmentKey,
      );
    }
    if (!personNames.has(application.personName)) {
      addError(
        errors,
        "지원현황",
        application.row,
        "인물 시트에 없는 이름",
        application.personName,
      );
    }
    if (application.interviewSessionKey) {
      const interview = interviewsByKey.get(application.interviewSessionKey);
      if (!interview) {
        addError(
          errors,
          "지원현황",
          application.row,
          "존재하지 않는 interview_session_key",
          application.interviewSessionKey,
        );
      } else if (interview.recruitmentKey !== application.recruitmentKey) {
        addError(
          errors,
          "지원현황",
          application.row,
          "면접 세션과 recruitment_key 불일치",
        );
      }
    }
    if (
      application.interviewOrder === null &&
      application.interviewSessionKey
    ) {
      addError(errors, "지원현황", application.row, "면접 순서 누락");
    }
    if (!application.result) {
      addError(errors, "지원현황", application.row, "지원 결과 오류");
    }
  }

  return errors;
}

export function validateStreamerAffiliations(people, affiliations) {
  const errors = [];
  const affiliationsByName = new Map(
    affiliations
      .filter((affiliation) => affiliation.name)
      .map((affiliation) => [affiliation.name, affiliation]),
  );

  validateUnique(
    affiliations,
    (affiliation) => affiliation.name,
    "스트리머소속",
    "소속명 중복",
    errors,
  );
  validateUnique(
    affiliations,
    (affiliation) => affiliation.filterOrder,
    "스트리머소속",
    "표시 순서 중복",
    errors,
  );

  for (const affiliation of affiliations) {
    if (!affiliation.name) {
      addError(errors, "스트리머소속", affiliation.row, "소속명 누락");
    }
    if (affiliation.type !== "mcn" && affiliation.type !== "group") {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "유형은 mcn 또는 group이어야 함",
        affiliation.type,
      );
    }
    if (affiliation.isFilterVisible === null) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "필터 노출은 TRUE 또는 FALSE여야 함",
      );
    }
    if (affiliation.isQuickFilter === null) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "빠른 선택은 TRUE 또는 FALSE여야 함",
      );
    }
    if (!affiliation.filterOrder) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "표시 순서는 양의 정수여야 함",
      );
    }
    if (affiliation.isQuickFilter === true) {
      if (affiliation.isFilterVisible !== true) {
        addError(
          errors,
          "스트리머소속",
          affiliation.row,
          "빠른 선택 소속은 필터에 노출되어야 함",
        );
      }
      if (!affiliation.quickFilterLabel) {
        addError(
          errors,
          "스트리머소속",
          affiliation.row,
          "빠른 선택 표시명 누락",
        );
      }
    } else if (affiliation.quickFilterLabel) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "빠른 선택이 FALSE이면 표시명을 입력할 수 없음",
      );
    }

    if (!affiliation.parentName) {
      continue;
    }
    if (affiliation.parentName === affiliation.name) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "자기 자신을 상위 소속으로 지정할 수 없음",
        affiliation.name,
      );
      continue;
    }

    const parent = affiliationsByName.get(affiliation.parentName);
    if (!parent) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "존재하지 않는 상위 소속",
        affiliation.parentName,
      );
      continue;
    }
    if (parent.parentName) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "소속 계층은 최대 2단계까지만 허용함",
        affiliation.name,
      );
    }
    if (hasAffiliationCycle(affiliation, affiliationsByName)) {
      addError(
        errors,
        "스트리머소속",
        affiliation.row,
        "소속 계층에 cycle이 존재함",
        affiliation.name,
      );
    }
  }

  for (const person of people) {
    for (const affiliation of person.affiliations) {
      const master = affiliationsByName.get(affiliation.name);
      if (!master) {
        addError(
          errors,
          "인물",
          person.row,
          "스트리머소속 시트에 없는 소속",
          affiliation.name,
        );
      } else if (master.type !== affiliation.type) {
        addError(
          errors,
          "인물",
          person.row,
          `${affiliation.type} 컬럼과 스트리머소속 유형 불일치`,
          affiliation.name,
        );
      }
    }
  }

  return errors;
}

function hasAffiliationCycle(start, affiliationsByName) {
  const visited = new Set();
  let current = start;

  while (current) {
    if (visited.has(current.name)) {
      return true;
    }
    visited.add(current.name);
    current = current.parentName
      ? affiliationsByName.get(current.parentName)
      : null;
  }

  return false;
}

function buildSummary(data) {
  const affiliations = data.people.flatMap((person) => person.affiliations);
  const histories = data.people.flatMap((person) => person.roleHistories);
  const crossTypeNames = [...new Set(
    affiliations
      .filter(
        (affiliation) =>
          affiliations.some(
            (candidate) =>
              candidate.name === affiliation.name &&
              candidate.type !== affiliation.type,
          ),
      )
      .map((affiliation) => affiliation.name),
  )];

  return {
    people: data.people.length,
    matchedBy: "chzzk_channel_id",
    affiliationMaster: {
      total: data.streamerAffiliations.length,
      parentRelations: data.streamerAffiliations.filter(
        (affiliation) => affiliation.parentName !== null,
      ).length,
      filterVisible: data.streamerAffiliations.filter(
        (affiliation) => affiliation.isFilterVisible,
      ).length,
      quickFilters: data.streamerAffiliations.filter(
        (affiliation) => affiliation.isQuickFilter,
      ).length,
    },
    affiliations: {
      memberships: affiliations.length,
      mcns: affiliations.filter((affiliation) => affiliation.type === "mcn")
        .length,
      groups: affiliations.filter((affiliation) => affiliation.type === "group")
        .length,
      uniqueMcns: new Set(
        affiliations
          .filter((affiliation) => affiliation.type === "mcn")
          .map((affiliation) => affiliation.name),
      ).size,
      uniqueGroups: new Set(
        affiliations
          .filter((affiliation) => affiliation.type === "group")
          .map((affiliation) => affiliation.name),
      ).size,
      crossTypeNames,
    },
    roleHistories: histories.length,
    organizations: data.organizations.length,
    recruitments: data.recruitments.length,
    interviews: data.interviews.length,
    applications: data.applications.length,
  };
}

function validateHeaders(headers, expectedHeaders, sheetName) {
  const missing = expectedHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(
      `${sheetName} 시트 필수 컬럼 누락: ${missing.join(", ")}`,
    );
  }
}

function validateUnique(rows, getKey, sheet, message, errors) {
  const seen = new Map();

  for (const row of rows) {
    const key = getKey(row);
    if (!key) {
      continue;
    }

    const previousRow = seen.get(key);
    if (previousRow) {
      addError(
        errors,
        sheet,
        row.row,
        `${message}; 최초 행 ${previousRow}`,
        String(key).replace("\u0000", " / "),
      );
    } else {
      seen.set(key, row.row);
    }
  }
}

function addError(errors, sheet, row, message, value = "") {
  errors.push({ sheet, row, message, value });
}

function extractChzzkChannelId(url) {
  const match = toText(url).match(
    /^https:\/\/chzzk\.naver\.com\/([0-9a-f]{32})\/?$/i,
  );
  return match?.[1]?.toLowerCase() ?? null;
}

function splitValues(value) {
  return toText(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toDateText(value) {
  const text = toText(value);
  return text || null;
}

function toTimeText(value) {
  if (typeof value === "number" && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}`;
  }

  const text = toText(value);
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function toBooleanValue(value) {
  if (value === true || toText(value).toUpperCase() === "TRUE") {
    return true;
  }
  if (value === false || toText(value).toUpperCase() === "FALSE") {
    return false;
  }
  return null;
}

function toBoolean(value) {
  return value === true || toText(value).toUpperCase() === "TRUE";
}

function isValidDate(value) {
  return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}
