const BULK_DELETE_MINIMUM = 20;
const BULK_DELETE_RATIO = 0.2;
const DETAIL_LIMIT = 20;

export async function loadSyncContext(client, excelData, requestedSeasonId) {
  const season = await loadSeason(client, requestedSeasonId);
  const [streamersResult, participantsResult, organizationsResult, seasonDaysResult, careerEventsResult, affiliationsResult, affiliationMembershipsResult, organizationMembershipsResult, historiesResult, jobsResult, recruitmentsResult, sessionsResult, applicationsResult] = await Promise.all([
    client.from("streamers").select("id, name, chzzk_channel_id, profile_image_key"),
    client.from("season_participants").select("id, season_id, streamer_id, rp_name, birth_date, stated_age").eq("season_id", season.id),
    client.from("organizations").select("id, season_id, slug, name, type").eq("season_id", season.id),
    client.from("season_days").select("id, season_id, day_number, session_date, starts_at, ends_at").eq("season_id", season.id),
    client.from("character_career_events").select("id, season_id, participant_id, event_type, from_organization_id, to_organization_id, from_role, to_role, event_date, event_at, sequence_in_day, season_day_id, note, source_url").eq("season_id", season.id),
    client.from("streamer_affiliations").select("id, slug, name, type, parent_affiliation_id, is_filter_visible, is_quick_filter, quick_filter_label, filter_order"),
    client.from("streamer_affiliation_memberships").select("id, streamer_id, affiliation_id, sort_order"),
    client.from("organization_memberships").select("id, participant_id, organization_id, role, joined_at, left_at, is_primary, display_order"),
    client.from("organization_role_histories").select("id, membership_id, role, start_date, end_date, is_leader"),
    client.from("public_jobs").select("id, slug, name"),
    client.from("job_recruitments").select("id, job_id, season_id, target_organization_id, title, opens_at, closes_at, recruitment_key, recruitment_type, round, status, notes").eq("season_id", season.id),
    client.from("job_interview_sessions").select("id, recruitment_id, starts_at, interview_session_key, round, notes"),
    client.from("job_applications").select("id, participant_id, recruitment_id, session_id, result, interview_order, role_after_pass, notes"),
  ]);

  for (const [result, label] of [
    [streamersResult, "스트리머 조회"],
    [participantsResult, "참가자 조회"],
    [organizationsResult, "조직 조회"],
    [seasonDaysResult, "시즌 일차 조회"],
    [careerEventsResult, "RP 이력 조회"],
    [affiliationsResult, "현실 소속 조회"],
    [affiliationMembershipsResult, "현실 소속 연결 조회"],
    [organizationMembershipsResult, "RP 조직 소속 조회"],
    [historiesResult, "RP 직책 경력 조회"],
    [jobsResult, "공무직 조회"],
    [recruitmentsResult, "채용 조회"],
    [sessionsResult, "면접 조회"],
    [applicationsResult, "지원 현황 조회"],
  ]) {
    assertNoError(result.error, label);
  }

  const streamersByChannelId = new Map(
    streamersResult.data
      .filter((streamer) => streamer.chzzk_channel_id)
      .map((streamer) => [streamer.chzzk_channel_id, streamer]),
  );
  const participantsByStreamerId = new Map(
    participantsResult.data.map((participant) => [participant.streamer_id, participant]),
  );
  const people = excelData.people.map((person) => {
    const streamer = streamersByChannelId.get(person.chzzkChannelId);
    const participant = streamer
      ? participantsByStreamerId.get(streamer.id)
      : null;
    return { person, streamer, participant };
  });
  return {
    season,
    people,
    streamers: streamersResult.data,
    participants: participantsResult.data,
    organizations: organizationsResult.data,
    seasonDays: seasonDaysResult.data,
    careerEvents: careerEventsResult.data,
    affiliations: affiliationsResult.data,
    affiliationMemberships: affiliationMembershipsResult.data,
    organizationMemberships: organizationMembershipsResult.data,
    histories: historiesResult.data,
    jobs: jobsResult.data,
    recruitments: recruitmentsResult.data,
    sessions: sessionsResult.data,
    applications: applicationsResult.data,
  };
}

export function buildSyncPlan(excelData, context) {
  validateCareerEventsForSeason(excelData.careerEvents, context.seasonDays);
  const matchedPeople = context.people.filter(
    ({ streamer, participant }) => streamer && participant,
  );
  const desired = buildDesiredState(excelData, { ...context, people: matchedPeople });
  const sourceStreamerIds = new Set(
    matchedPeople.map(({ streamer }) => streamer.id),
  );
  const sourceParticipantIds = new Set(
    matchedPeople.map(({ participant }) => participant.id),
  );
  const streamers = createOnlySection(
    context.people
      .filter(({ streamer }) => !streamer)
      .map(({ person }) => ({
        key: person.chzzkChannelId,
        label: person.name,
        desired: {
          name: person.name,
          chzzkChannelId: person.chzzkChannelId,
          profileImageKey: person.profileImageKey,
          slug: `streamer-${person.chzzkChannelId}`,
        },
      })),
  );
  const participants = createOnlySection(
    context.people
      .filter(({ participant }) => !participant)
      .map(({ person }) => ({
        key: person.chzzkChannelId,
        label: person.name,
        desired: {
          chzzkChannelId: person.chzzkChannelId,
          rpName: person.rpName,
          birthDate: person.birthDate,
          statedAge: person.statedAge,
        },
      })),
  );
  const organizationsById = new Map(context.organizations.map((row) => [row.id, row]));
  const affiliationsById = new Map(context.affiliations.map((row) => [row.id, row]));
  const membershipsById = new Map(context.organizationMemberships.map((row) => [row.id, row]));
  const recruitmentIds = new Set(context.recruitments.map((row) => row.id));

  const currentPeople = matchedPeople.map(({ person, streamer, participant }) => ({
    key: participant.id,
    label: person.name,
    rpName: participant.rp_name,
    birthDate: participant.birth_date,
    statedAge: participant.stated_age,
    profileImageKey: streamer.profile_image_key,
  }));
  const people = diffRows(
    currentPeople,
    desired.people,
    (row) => row.key,
    (left, right) =>
      left.rpName === right.rpName &&
      left.birthDate === right.birthDate &&
      left.statedAge === right.statedAge &&
      (right.profileImageKey === null || left.profileImageKey === right.profileImageKey),
  );

  const currentAffiliations = context.affiliations.map((row) => ({
    key: affiliationKey(row.type, row.name),
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    parentName: row.parent_affiliation_id
      ? affiliationsById.get(row.parent_affiliation_id)?.name ?? null
      : null,
    isFilterVisible: row.is_filter_visible,
    isQuickFilter: row.is_quick_filter,
    quickFilterLabel: row.quick_filter_label,
    filterOrder: row.filter_order,
    label: `${row.name} / ${row.type}`,
  }));
  const affiliations = diffRows(
    currentAffiliations,
    desired.affiliations,
    (row) => row.key,
    (left, right) =>
      left.slug === right.slug &&
      left.parentName === right.parentName &&
      left.isFilterVisible === right.isFilterVisible &&
      left.isQuickFilter === right.isQuickFilter &&
      left.quickFilterLabel === right.quickFilterLabel &&
      left.filterOrder === right.filterOrder,
  );

  const currentAffiliationMemberships = context.affiliationMemberships
    .filter((row) => sourceStreamerIds.has(row.streamer_id))
    .map((row) => {
      const affiliation = affiliationsById.get(row.affiliation_id);
      return {
        key: membershipKey(row.streamer_id, affiliationKey(affiliation.type, affiliation.name)),
        id: row.id,
        streamerId: row.streamer_id,
        affiliationKey: affiliationKey(affiliation.type, affiliation.name),
        sortOrder: row.sort_order,
        label: `${findPersonName(context, row.streamer_id)} / ${affiliation.name} (${affiliation.type})`,
      };
    });
  const affiliationMemberships = diffRows(
    currentAffiliationMemberships,
    desired.affiliationMemberships,
    (row) => row.key,
    (left, right) => left.sortOrder === right.sortOrder,
  );
  const plannedAffiliationMembershipDeletes = new Set(
    affiliationMemberships.delete.map((item) => item.current.id),
  );
  const remainingAffiliationMemberships = context.affiliationMemberships.filter(
    (row) => !plannedAffiliationMembershipDeletes.has(row.id),
  );
  affiliations.delete = affiliations.delete.filter(
    (affiliation) =>
      !remainingAffiliationMemberships.some(
        (membership) => membership.affiliation_id === affiliation.id,
      ),
  );

  const currentOrganizations = context.organizations.map((row) => ({
    key: row.name,
    id: row.id,
    slug: row.slug,
    type: row.type,
    label: row.name,
  }));
  const organizations = diffRows(
    currentOrganizations,
    desired.organizations,
    (row) => row.key,
    (left, right) => left.slug === right.slug && left.type === right.type,
  );

  const currentOrganizationMemberships = context.organizationMemberships
    .filter((row) => sourceParticipantIds.has(row.participant_id))
    .map((row) => {
      const organization = organizationsById.get(row.organization_id);
      return {
        key: membershipKey(row.participant_id, organization.name),
        id: row.id,
        participantId: row.participant_id,
        organizationName: organization.name,
        role: row.role,
        joinedAt: normalizeTimestamp(row.joined_at),
        leftAt: normalizeTimestamp(row.left_at),
        isPrimary: row.is_primary,
        displayOrder: row.display_order,
        label: `${findPersonNameByParticipant(context, row.participant_id)} / ${organization.name}`,
      };
    });
  const organizationMemberships = diffRows(
    currentOrganizationMemberships,
    desired.organizationMemberships,
    (row) => row.key,
    (left, right) =>
      left.role === right.role &&
      left.joinedAt === normalizeTimestamp(right.joinedAt) &&
      left.leftAt === normalizeTimestamp(right.leftAt) &&
      left.isPrimary === right.isPrimary &&
      left.displayOrder === right.displayOrder,
  );

  const currentHistories = context.histories
    .filter((row) => membershipsById.has(row.membership_id))
    .map((row) => {
      const membership = membershipsById.get(row.membership_id);
      const organization = organizationsById.get(membership.organization_id);
      if (!sourceParticipantIds.has(membership.participant_id)) return null;
      return {
        key: historyKey(membership.participant_id, organization.name, row.role, row.start_date, row.end_date),
        id: row.id,
        membershipKey: membershipKey(membership.participant_id, organization.name),
        role: row.role,
        startDate: row.start_date,
        endDate: row.end_date,
        isLeader: row.is_leader,
        label: `${findPersonNameByParticipant(context, membership.participant_id)} / ${organization.name} / ${row.role ?? "직책 없음"}`,
      };
    })
    .filter(Boolean);
  const roleHistories = diffRows(
    currentHistories,
    desired.roleHistories,
    (row) => row.key,
    (left, right) => left.isLeader === right.isLeader,
  );

  const seasonDaysById = new Map(context.seasonDays.map((row) => [row.id, row]));
  const currentCareerEvents = context.careerEvents
    .filter((row) => sourceParticipantIds.has(row.participant_id))
    .map((row) => ({
      key: careerEventKey(row.participant_id, row.event_date, row.sequence_in_day),
      id: row.id,
      participantId: row.participant_id,
      eventType: row.event_type,
      fromOrganizationName: row.from_organization_id
        ? organizationsById.get(row.from_organization_id)?.name ?? null
        : null,
      toOrganizationName: row.to_organization_id
        ? organizationsById.get(row.to_organization_id)?.name ?? null
        : null,
      fromRole: row.from_role,
      toRole: row.to_role,
      eventDate: row.event_date,
      eventAt: normalizeTimestamp(row.event_at),
      sequenceInDay: row.sequence_in_day,
      seasonDayNumber: row.season_day_id
        ? seasonDaysById.get(row.season_day_id)?.day_number ?? null
        : null,
      note: row.note,
      sourceUrl: row.source_url,
      label: `${findPersonNameByParticipant(context, row.participant_id)} / ${row.event_date} / ${row.event_type}`,
    }));
  const careerEvents = excelData.hasCareerEventsSheet
    ? diffRowsWithoutDelete(
        currentCareerEvents,
        desired.careerEvents,
        (row) => row.key,
        (left, right) =>
          left.eventType === right.eventType &&
          left.fromOrganizationName === right.fromOrganizationName &&
          left.toOrganizationName === right.toOrganizationName &&
          left.fromRole === right.fromRole &&
          left.toRole === right.toRole &&
          left.eventAt === normalizeTimestamp(right.eventAt) &&
          left.seasonDayNumber === right.seasonDayNumber &&
          left.note === right.note &&
          left.sourceUrl === right.sourceUrl,
      )
    : createUnmanagedSection(currentCareerEvents);

  const currentJobs = context.jobs
    .filter((row) => row.slug.startsWith("public-job-"))
    .map((row) => ({ key: row.slug, id: row.id, slug: row.slug, name: row.name, label: row.name }));
  const publicJobs = diffRows(
    currentJobs,
    desired.publicJobs,
    (row) => row.key,
    (left, right) => left.name === right.name,
  );
  publicJobs.delete = publicJobs.delete.filter(
    (job) => !context.recruitments.some((recruitment) => recruitment.job_id === job.id),
  );

  const jobsById = new Map(context.jobs.map((row) => [row.id, row]));
  const currentRecruitments = context.recruitments.map((row) => ({
    key: row.recruitment_key,
    id: row.id,
    jobId: row.job_id,
    organizationId: row.target_organization_id,
    title: row.title,
    type: row.recruitment_type,
    round: row.round,
    status: row.status,
    notes: row.notes,
    jobSlug: jobsById.get(row.job_id)?.slug ?? null,
    organizationName: organizationsById.get(row.target_organization_id)?.name ?? null,
    label: row.recruitment_key,
  }));
  const recruitments = diffRows(
    currentRecruitments,
    desired.recruitments,
    (row) => row.key,
    (left, right) =>
      left.jobSlug === right.jobSlug &&
      left.organizationName === right.organizationName &&
      left.title === right.title &&
      left.type === right.type &&
      left.round === right.round &&
      left.status === right.status &&
      left.notes === right.notes,
  );

  const recruitmentsById = new Map(context.recruitments.map((row) => [row.id, row]));
  const currentSessions = context.sessions
    .filter((row) => recruitmentIds.has(row.recruitment_id))
    .map((row) => ({
      key: row.interview_session_key,
      id: row.id,
      recruitmentId: row.recruitment_id,
      startsAt: row.starts_at,
      round: row.round,
      notes: row.notes,
      recruitmentKey: recruitmentsById.get(row.recruitment_id)?.recruitment_key ?? null,
      label: row.interview_session_key,
    }));
  const interviews = diffRows(
    currentSessions,
    desired.interviews,
    (row) => row.key,
    (left, right) =>
      left.recruitmentKey === right.recruitmentKey &&
      normalizeTimestamp(left.startsAt) === normalizeTimestamp(right.startsAt) &&
      left.round === right.round &&
      left.notes === right.notes,
  );

  const sessionsById = new Map(context.sessions.map((row) => [row.id, row]));
  const currentApplications = context.applications
    .filter((row) => recruitmentIds.has(row.recruitment_id))
    .map((row) => ({
      key: applicationKey(row.participant_id, findRecruitmentKey(context, row.recruitment_id)),
      id: row.id,
      participantId: row.participant_id,
      recruitmentId: row.recruitment_id,
      sessionId: row.session_id,
      result: row.result,
      interviewOrder: row.interview_order,
      roleAfterPass: row.role_after_pass,
      notes: row.notes,
      sessionKey: row.session_id
        ? sessionsById.get(row.session_id)?.interview_session_key ?? null
        : null,
      label: `${findPersonNameByParticipant(context, row.participant_id)} / ${findRecruitmentKey(context, row.recruitment_id)}`,
    }));
  const applications = diffRows(
    currentApplications,
    desired.applications,
    (row) => row.key,
    (left, right) =>
      left.sessionKey === right.sessionKey &&
      left.result === right.result &&
      left.interviewOrder === right.interviewOrder &&
      left.roleAfterPass === right.roleAfterPass &&
      left.notes === right.notes,
  );

  return {
    excelData,
    desired,
    context,
    sections: {
      streamers,
      participants,
      people,
      affiliations,
      affiliationMemberships,
      organizations,
      organizationMemberships,
      roleHistories,
      careerEvents,
      publicJobs,
      recruitments,
      interviews,
      applications,
    },
  };
}

export function hasChanges(plan) {
  return Object.values(plan.sections).some(
    (section) => section.create.length || section.update.length || section.delete.length,
  );
}

export function getDeleteSafetyWarnings(plan) {
  return Object.entries(plan.sections)
    .filter(([, section]) => section.delete.length > 0)
    .flatMap(([name, section]) => {
      const ratio = section.currentCount === 0 ? 0 : section.delete.length / section.currentCount;
      if (section.delete.length >= BULK_DELETE_MINIMUM || ratio >= BULK_DELETE_RATIO) {
        return [{ name, count: section.delete.length, currentCount: section.currentCount, ratio }];
      }
      return [];
    });
}

export function renderSyncPlan(plan, mode) {
  const labels = {
    streamers: "스트리머",
    participants: "시즌 참가자",
    people: "인물 / RP 이름",
    affiliations: "현실 소속 마스터",
    affiliationMemberships: "현실 소속 연결",
    organizations: "RP 조직",
    organizationMemberships: "RP 조직 소속",
    roleHistories: "RP 직책 경력",
    careerEvents: "RP 사건형 이력",
    publicJobs: "공무직",
    recruitments: "공무직 채용",
    interviews: "면접 일정",
    applications: "지원 현황",
  };
  const lines = [`[봉누도2 Sync ${mode}]`];
  for (const [name, section] of Object.entries(plan.sections)) {
    lines.push("", labels[name]);
    lines.push(`  추가: ${section.create.length}`);
    lines.push(`  수정: ${section.update.length}`);
    lines.push(`  삭제: ${section.delete.length}`);
    lines.push(`  유지: ${section.unchanged.length}`);
  }
  const changes = Object.values(plan.sections)
    .flatMap((section) => [
      ...section.create.map((item) => ({ kind: "추가", item })),
      ...section.update.map((item) => ({ kind: "수정", item })),
      ...section.delete.map((item) => ({ kind: "삭제", item })),
    ])
    .slice(0, DETAIL_LIMIT);
  if (changes.length > 0) {
    lines.push("", "[주요 변경]");
    for (const { kind, item } of changes) {
      lines.push(`${kind}: ${item.desired?.label ?? item.current?.label ?? item.label}`);
      if (kind === "수정") {
        lines.push(`  기존: ${describe(item.current)}`);
        lines.push(`  변경: ${describe(item.desired)}`);
      }
    }
  }
  const warnings = getDeleteSafetyWarnings(plan);
  if (warnings.length > 0) {
    lines.push("", "[대량 삭제 위험]");
    for (const warning of warnings) {
      lines.push(`${warning.name}: ${warning.count}/${warning.currentCount}건 삭제 예정 (${Math.round(warning.ratio * 100)}%)`);
    }
  }
  return lines.join("\n");
}

export async function applySyncPlan(client, plan, force) {
  const warnings = getDeleteSafetyWarnings(plan);
  if (warnings.length > 0 && !force) {
    throw new Error("대량 삭제 위험: --force 없이 실행할 수 없음. dry-run에서 삭제 예정 내역을 확인해주세요.");
  }

  await createMissingPeople(client, plan);

  const refreshedContext = await loadSyncContext(
    client,
    { people: plan.excelData.people },
    plan.context.season.id,
  );
  const refreshedPlan = buildSyncPlan(plan.excelData, refreshedContext);
  refreshedPlan.excelData = plan.excelData;
  const refreshedWarnings = getDeleteSafetyWarnings(refreshedPlan);
  if (refreshedWarnings.length > 0 && !force) {
    throw new Error("대량 삭제 위험: --force 없이 실행할 수 없음. dry-run에서 삭제 예정 내역을 확인해주세요.");
  }

  const { sections, desired, context } = refreshedPlan;
  await updatePeople(client, sectionDesired(sections.people));
  const affiliationRows = sectionDesired(sections.affiliations);
  await upsertRows(
    client,
    "streamer_affiliations",
    affiliationRows,
    "type,name",
    toAffiliationMasterRow,
  );
  let affiliations = await selectAll(
    client,
    "streamer_affiliations",
    "id, slug, name, type",
  );
  let affiliationsByKey = new Map(
    affiliations.map((row) => [affiliationKey(row.type, row.name), row]),
  );
  const desiredAffiliationsByName = new Map(
    desired.affiliations.map((row) => [row.name, row]),
  );
  await upsertRows(
    client,
    "streamer_affiliations",
    affiliationRows,
    "type,name",
    (row) => ({
      ...toAffiliationMasterRow(row),
      parent_affiliation_id: row.parentName
        ? affiliationsByKey.get(
            desiredAffiliationsByName.get(row.parentName)?.key,
          )?.id ?? null
        : null,
    }),
  );
  affiliations = await selectAll(
    client,
    "streamer_affiliations",
    "id, slug, name, type",
  );
  affiliationsByKey = new Map(
    affiliations.map((row) => [affiliationKey(row.type, row.name), row]),
  );
  await upsertRows(client, "streamer_affiliation_memberships", sectionDesired(sections.affiliationMemberships), "streamer_id,affiliation_id", (row) => ({ streamer_id: row.streamerId, affiliation_id: affiliationsByKey.get(row.affiliationKey).id, sort_order: row.sortOrder }));
  await deleteRows(client, "streamer_affiliation_memberships", sections.affiliationMemberships.delete.map((item) => item.current.id));
  await deleteRows(client, "streamer_affiliations", sections.affiliations.delete.map((item) => item.current.id));

  await applyOrganizations(client, sectionDesired(sections.organizations), context.season.id);
  const organizations = await selectSeasonRows(client, "organizations", "id, name, slug, type", context.season.id);
  const organizationsByName = new Map(organizations.map((row) => [row.name, row]));
  await applyOrganizationMemberships(client, sections.organizationMemberships, organizationsByName, context.season.id);
  const memberships = await selectAll(client, "organization_memberships", "id, participant_id, organization_id");
  const membershipIds = new Map(memberships.map((row) => [membershipKey(row.participant_id, findOrganizationName(organizationsByName, row.organization_id)), row]));
  await deleteRows(client, "organization_role_histories", sections.roleHistories.delete.map((item) => item.current.id));
  await upsertRows(client, "organization_role_histories", sectionDesired(sections.roleHistories), "membership_id,role,start_date,end_date", (row) => ({ membership_id: membershipIds.get(row.membershipKey).id, role: row.role, start_date: row.startDate, end_date: row.endDate, is_leader: row.isLeader }));
  await deleteRows(client, "organization_memberships", sections.organizationMemberships.delete.map((item) => item.current.id));
  const seasonDays = await selectSeasonRows(
    client,
    "season_days",
    "id, day_number",
    context.season.id,
  );
  const seasonDaysByNumber = new Map(
    seasonDays.map((seasonDay) => [seasonDay.day_number, seasonDay]),
  );
  await deleteRows(
    client,
    "character_career_events",
    sections.careerEvents.delete.map((item) => item.current.id),
  );
  await upsertRows(
    client,
    "character_career_events",
    sectionDesired(sections.careerEvents),
    "participant_id,event_date,sequence_in_day",
    (row) => ({
      season_id: context.season.id,
      participant_id: row.participantId,
      event_type: row.eventType,
      from_organization_id: row.fromOrganizationName
        ? organizationsByName.get(row.fromOrganizationName).id
        : null,
      to_organization_id: row.toOrganizationName
        ? organizationsByName.get(row.toOrganizationName).id
        : null,
      from_role: row.fromRole,
      to_role: row.toRole,
      event_date: row.eventDate,
      event_at: row.eventAt,
      sequence_in_day: row.sequenceInDay,
      season_day_id: row.seasonDayNumber
        ? seasonDaysByNumber.get(row.seasonDayNumber).id
        : null,
      note: row.note,
      source_url: row.sourceUrl,
    }),
  );

  await upsertRows(client, "public_jobs", sectionDesired(sections.publicJobs), "slug", (row) => ({ slug: row.slug, name: row.name }));
  const jobs = await selectAll(client, "public_jobs", "id, slug, name");
  const jobsBySlug = new Map(jobs.map((row) => [row.slug, row]));
  await upsertRows(client, "job_recruitments", sectionDesired(sections.recruitments), "recruitment_key", (row) => ({ job_id: jobsBySlug.get(row.jobSlug).id, season_id: context.season.id, target_organization_id: organizationsByName.get(row.organizationName).id, title: row.title, recruitment_key: row.key, recruitment_type: row.type, round: row.round, status: row.status, notes: row.notes }));
  await deleteRows(client, "job_applications", sections.applications.delete.map((item) => item.current.id));
  await deleteRows(client, "job_interview_sessions", sections.interviews.delete.map((item) => item.current.id));
  await deleteRows(client, "job_recruitments", sections.recruitments.delete.map((item) => item.current.id));
  const recruitments = await selectSeasonRows(client, "job_recruitments", "id, recruitment_key", context.season.id);
  const recruitmentsByKey = new Map(recruitments.map((row) => [row.recruitment_key, row]));
  await upsertRows(client, "job_interview_sessions", sectionDesired(sections.interviews), "interview_session_key", (row) => ({ recruitment_id: recruitmentsByKey.get(row.recruitmentKey).id, starts_at: row.startsAt, interview_session_key: row.key, round: row.round, notes: row.notes }));
  const sessions = await selectAll(client, "job_interview_sessions", "id, interview_session_key");
  const sessionsByKey = new Map(sessions.map((row) => [row.interview_session_key, row]));
  await upsertRows(client, "job_applications", sectionDesired(sections.applications), "participant_id,recruitment_id", (row) => ({ participant_id: row.participantId, recruitment_id: recruitmentsByKey.get(row.recruitmentKey).id, session_id: row.sessionKey ? sessionsByKey.get(row.sessionKey).id : null, result: row.result, interview_order: row.interviewOrder, role_after_pass: row.roleAfterPass, notes: row.notes }));
  await deleteRows(client, "public_jobs", sections.publicJobs.delete.map((item) => item.current.id));

  const refreshed = await loadSyncContext(client, { people: desired.people.map((row) => row.source) }, context.season.id);
  const afterPlan = buildSyncPlan({ ...refreshedPlan.excelData, people: refreshedPlan.excelData.people }, refreshed);
  if (hasChanges(afterPlan)) {
    throw new Error(`적용 후 동기화 불일치가 남음.\n${renderSyncPlan(afterPlan, "Post Apply Validation")}`);
  }
}

async function createMissingPeople(client, plan) {
  const streamerRows = plan.sections.streamers.create.map((item) => item.desired);
  for (const batch of chunks(streamerRows, 100)) {
    if (!batch.length) continue;
    const { error } = await client.from("streamers").insert(
      batch.map((row) => ({
        name: row.name,
        slug: row.slug,
        chzzk_channel_id: row.chzzkChannelId,
        profile_image_key: row.profileImageKey,
      })),
    );
    assertNoError(error, "스트리머 생성");
  }

  const participantRows = plan.sections.participants.create.map((item) => item.desired);
  if (!participantRows.length) return;

  const streamersByChannelId = new Map(
    plan.context.streamers
      .filter((streamer) => streamer.chzzk_channel_id)
      .map((streamer) => [streamer.chzzk_channel_id, streamer]),
  );
  for (const batch of chunks(participantRows, 100)) {
    const channelIds = batch.map((row) => row.chzzkChannelId);
    const { data, error } = await client
      .from("streamers")
      .select("id, chzzk_channel_id")
      .in("chzzk_channel_id", channelIds);
    assertNoError(error, "신규 스트리머 조회");
    for (const streamer of data) {
      if (streamer.chzzk_channel_id) {
        streamersByChannelId.set(streamer.chzzk_channel_id, streamer);
      }
    }

    const missingChannelIds = channelIds.filter(
      (channelId) => !streamersByChannelId.has(channelId),
    );
    if (missingChannelIds.length > 0) {
      throw new Error(`신규 스트리머를 찾지 못함: ${missingChannelIds.join(", ")}`);
    }

    const { error: insertError } = await client.from("season_participants").insert(
      batch.map((row) => ({
        season_id: plan.context.season.id,
        streamer_id: streamersByChannelId.get(row.chzzkChannelId).id,
        rp_name: row.rpName,
        birth_date: row.birthDate,
        stated_age: row.statedAge,
      })),
    );
    assertNoError(insertError, "시즌 참가자 생성");
  }
}

function buildDesiredState(excelData, context) {
  const people = context.people.map(({ person, streamer, participant }) => ({ key: participant.id, label: person.name, rpName: person.rpName, birthDate: person.birthDate, statedAge: person.statedAge, profileImageKey: person.profileImageKey, source: person, streamerId: streamer.id, participantId: participant.id }));
  const organizations = excelData.organizations.map((organization) => ({ key: organization.name, label: organization.name, name: organization.name, slug: organization.slug, type: organization.type, category: organization.category }));
  const affiliations = excelData.streamerAffiliations.map((affiliation) => ({
    key: affiliationKey(affiliation.type, affiliation.name),
    label: `${affiliation.name} / ${affiliation.type}`,
    slug: affiliation.slug,
    name: affiliation.name,
    type: affiliation.type,
    parentName: affiliation.parentName,
    isFilterVisible: affiliation.isFilterVisible,
    isQuickFilter: affiliation.isQuickFilter,
    quickFilterLabel: affiliation.quickFilterLabel,
    filterOrder: affiliation.filterOrder,
  }));
  const affiliationMemberships = [];
  const organizationMemberships = [];
  const roleHistories = [];
  for (const { person, streamer, participant } of context.people) {
    for (const affiliation of person.affiliations) {
      const key = affiliationKey(affiliation.type, affiliation.name);
      affiliationMemberships.push({ key: membershipKey(streamer.id, key), label: `${person.name} / ${affiliation.name} (${affiliation.type})`, streamerId: streamer.id, affiliationKey: key, sortOrder: affiliation.sortOrder });
    }
    const grouped = new Map();
    for (const history of person.roleHistories) grouped.set(history.organization, [...(grouped.get(history.organization) ?? []), history]);
    let displayOrder = 1;
    for (const [organizationName, histories] of grouped) {
      const currentHistory = histories.find((history) => !history.endDate);
      const startDates = histories.map((history) => history.startDate).filter(Boolean).sort();
      const endDates = histories.map((history) => history.endDate).filter(Boolean).sort();
      const key = membershipKey(participant.id, organizationName);
      organizationMemberships.push({ key, label: `${person.name} / ${organizationName}`, participantId: participant.id, organizationName, role: currentHistory?.role ?? histories.at(-1)?.role ?? null, joinedAt: startDates.length ? `${startDates[0]}T00:00:00+09:00` : null, leftAt: currentHistory || !endDates.length ? null : `${endDates.at(-1)}T23:59:59+09:00`, isPrimary: person.primaryOrganization === organizationName, displayOrder });
      for (const history of histories) roleHistories.push({ key: historyKey(participant.id, organizationName, history.role, history.startDate, history.endDate), membershipKey: key, label: `${person.name} / ${organizationName} / ${history.role ?? "직책 없음"}`, role: history.role, startDate: history.startDate, endDate: history.endDate, isLeader: history.isLeader });
      displayOrder += 1;
    }
  }
  const publicJobs = organizations.filter((organization) => organization.category === "공무직").map((organization) => ({ key: `public-job-${organization.slug}`, slug: `public-job-${organization.slug}`, name: organization.name, label: organization.name }));
  const jobSlugByOrganization = new Map(publicJobs.map((job) => [job.name, job.slug]));
  const recruitments = excelData.recruitments.map((row) => ({ key: row.key, label: row.key, jobSlug: jobSlugByOrganization.get(row.organization), organizationName: row.organization, title: row.title, type: row.type, round: row.round, status: row.status, notes: row.notes }));
  const peopleByName = new Map(people.map((row) => [row.label, row]));
  const interviews = excelData.interviews.map((row) => ({ key: row.key, label: row.key, recruitmentKey: row.recruitmentKey, startsAt: row.startsAt, round: row.round, notes: row.notes }));
  const applications = excelData.applications.map((row) => {
    const person = peopleByName.get(row.personName);
    return { key: applicationKey(person.participantId, row.recruitmentKey), label: `${row.personName} / ${row.recruitmentKey}`, participantId: person.participantId, recruitmentKey: row.recruitmentKey, sessionKey: row.interviewSessionKey, result: row.result, interviewOrder: row.interviewOrder, roleAfterPass: row.roleAfterPass, notes: row.notes };
  });
  const careerEvents = excelData.careerEvents.flatMap((row) => {
    const person = peopleByName.get(row.personName);
    if (!person) {
      return [];
    }

    return [{
      key: careerEventKey(person.participantId, row.eventDate, row.sequenceInDay),
      label: `${row.personName} / ${row.eventDate} / ${row.eventType}`,
      participantId: person.participantId,
      eventType: row.eventType,
      fromOrganizationName: row.fromOrganization,
      toOrganizationName: row.toOrganization,
      fromRole: row.fromRole,
      toRole: row.toRole,
      eventDate: row.eventDate,
      eventAt: row.eventAt,
      sequenceInDay: row.sequenceInDay,
      seasonDayNumber: row.seasonDayNumber,
      note: row.note,
      sourceUrl: row.sourceUrl,
    }];
  });
  return { people, affiliations, affiliationMemberships, organizations, organizationMemberships, roleHistories, careerEvents, publicJobs, recruitments, interviews, applications };
}

function validateCareerEventsForSeason(careerEvents, seasonDays) {
  const seasonDaysByNumber = new Map(
    seasonDays.map((seasonDay) => [seasonDay.day_number, seasonDay]),
  );

  for (const event of careerEvents) {
    const seasonDay = event.seasonDayNumber
      ? seasonDaysByNumber.get(event.seasonDayNumber)
      : null;

    if (event.seasonDayNumber && !seasonDay) {
      throw new Error(
        `RP이력 ${event.row}행: 존재하지 않는 season_day_number입니다. (${event.seasonDayNumber})`,
      );
    }
    if (event.eventAt && seasonDay && !isWithinSeasonDay(event.eventAt, seasonDay)) {
      throw new Error(
        `RP이력 ${event.row}행: event_time과 season_day_number가 서로 맞지 않습니다.`,
      );
    }
  }
}

function diffRows(current, desired, getKey, isEqual) {
  const currentByKey = new Map(current.map((row) => [getKey(row), row]));
  const desiredByKey = new Map(desired.map((row) => [getKey(row), row]));
  const create = [];
  const update = [];
  const unchanged = [];
  const remove = [];
  for (const [key, desiredRow] of desiredByKey) {
    const currentRow = currentByKey.get(key);
    if (!currentRow) create.push({ key, desired: desiredRow });
    else if (isEqual(currentRow, desiredRow)) unchanged.push({ key, current: currentRow, desired: desiredRow });
    else update.push({ key, current: currentRow, desired: desiredRow });
  }
  for (const [key, currentRow] of currentByKey) if (!desiredByKey.has(key)) remove.push({ key, current: currentRow });
  return { create, update, delete: remove, unchanged, currentCount: current.length };
}

function diffRowsWithoutDelete(current, desired, getKey, isEqual) {
  const currentByKey = new Map(current.map((row) => [getKey(row), row]));
  const desiredKeys = new Set(desired.map(getKey));
  const create = [];
  const update = [];
  const unchanged = [];

  for (const desiredRow of desired) {
    const key = getKey(desiredRow);
    const currentRow = currentByKey.get(key);
    if (!currentRow) {
      create.push({ key, desired: desiredRow });
    } else if (isEqual(currentRow, desiredRow)) {
      unchanged.push({ key, current: currentRow, desired: desiredRow });
    } else {
      update.push({ key, current: currentRow, desired: desiredRow });
    }
  }

  for (const [key, currentRow] of currentByKey) {
    if (!desiredKeys.has(key)) {
      unchanged.push({ key, current: currentRow });
    }
  }

  return { create, update, delete: [], unchanged, currentCount: current.length };
}

function createOnlySection(rows) {
  return {
    create: rows,
    update: [],
    delete: [],
    unchanged: [],
    currentCount: 0,
  };
}

function createUnmanagedSection(rows) {
  return {
    create: [],
    update: [],
    delete: [],
    unchanged: rows.map((row) => ({ key: row.key, current: row })),
    currentCount: rows.length,
  };
}

async function loadSeason(client, requestedSeasonId) {
  let query = client.from("seasons").select("id, slug, name, is_active");
  query = requestedSeasonId ? query.eq("id", requestedSeasonId) : query.eq("is_active", true);
  const { data, error } = await query;
  assertNoError(error, "시즌 조회");
  if (data.length !== 1) throw new Error(requestedSeasonId ? `시즌 ${requestedSeasonId}을 정확히 한 건 찾지 못함.` : "활성 시즌이 정확히 한 건이어야 함. --season으로 지정 가능함.");
  return data[0];
}

async function updatePeople(client, rows) {
  for (const row of rows) {
    const { error: participantError } = await client.from("season_participants").update({ rp_name: row.rpName, birth_date: row.birthDate, stated_age: row.statedAge }).eq("id", row.key);
    assertNoError(participantError, "RP 이름 동기화");
    if (row.profileImageKey) {
      const { error: streamerError } = await client.from("streamers").update({ profile_image_key: row.profileImageKey }).eq("id", row.streamerId);
      assertNoError(streamerError, "프로필 이미지 키 동기화");
    }
  }
}

async function applyOrganizations(client, rows, seasonId) {
  for (const row of rows) {
    const { data: existing, error: readError } = await client.from("organizations").select("id").eq("season_id", seasonId).eq("name", row.key).maybeSingle();
    assertNoError(readError, "RP 조직 조회");
    const values = { season_id: seasonId, slug: row.slug, name: row.key, type: row.type };
    const { error } = existing ? await client.from("organizations").update(values).eq("id", existing.id) : await client.from("organizations").insert(values);
    assertNoError(error, "RP 조직 동기화");
  }
}

async function applyOrganizationMemberships(client, section, organizationsByName) {
  const rows = sectionDesired(section);
  const falsePrimary = [...section.update, ...section.delete]
    .filter((item) => item.current.isPrimary && !item.desired?.isPrimary)
    .map((item) => item.current.id);
  await updateRows(client, "organization_memberships", falsePrimary, { is_primary: false });
  // role, joined_at, left_at는 frontend 전환 전 호환성을 위한 legacy field임.
  await upsertRows(client, "organization_memberships", rows, "participant_id,organization_id", (row) => ({ participant_id: row.participantId, organization_id: organizationsByName.get(row.organizationName).id, role: row.role, joined_at: row.joinedAt, left_at: row.leftAt, is_primary: row.isPrimary, display_order: row.displayOrder }));
}

async function upsertRows(client, table, rows, onConflict, mapRow) {
  const mapped = rows.map(mapRow);
  for (const batch of chunks(mapped, 100)) {
    if (!batch.length) continue;
    const { error } = await client.from(table).upsert(batch, { onConflict });
    assertNoError(error, `${table} 동기화`);
  }
}

async function selectAll(client, table, columns) {
  const { data, error } = await client.from(table).select(columns);
  assertNoError(error, `${table} 재조회`);
  return data;
}

async function selectSeasonRows(client, table, columns, seasonId) {
  const { data, error } = await client.from(table).select(columns).eq("season_id", seasonId);
  assertNoError(error, `${table} 재조회`);
  return data;
}

async function deleteRows(client, table, ids) {
  for (const batch of chunks(ids, 100)) {
    if (!batch.length) continue;
    const { error } = await client.from(table).delete().in("id", batch);
    assertNoError(error, `${table} stale 데이터 정리`);
  }
}

async function updateRows(client, table, ids, values) {
  for (const batch of chunks(ids, 100)) {
    if (!batch.length) continue;
    const { error } = await client.from(table).update(values).in("id", batch);
    assertNoError(error, `${table} 갱신`);
  }
}

function sectionDesired(section) { return [...section.create, ...section.update].map((item) => item.desired); }
function chunks(values, size) { const output = []; for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size)); return output; }
function affiliationKey(type, name) { return `${type}\u0000${name}`; }

function toAffiliationMasterRow(row) {
  return {
    slug: row.slug,
    name: row.name,
    type: row.type,
    is_filter_visible: row.isFilterVisible,
    is_quick_filter: row.isQuickFilter,
    quick_filter_label: row.quickFilterLabel,
    filter_order: row.filterOrder,
  };
}
function membershipKey(left, right) { return `${left}\u0000${right}`; }
function applicationKey(participantId, recruitmentKeyOrId) { return `${participantId}\u0000${recruitmentKeyOrId}`; }
function historyKey(participantId, organizationName, role, startDate, endDate) { return [participantId, organizationName, role ?? "", startDate ?? "", endDate ?? ""].join("\u0000"); }
function careerEventKey(participantId, eventDate, sequenceInDay) { return [participantId, eventDate, sequenceInDay].join("\u0000"); }
function isWithinSeasonDay(eventAt, seasonDay) {
  const target = new Date(eventAt).getTime();
  return target >= new Date(seasonDay.starts_at).getTime() && target < new Date(seasonDay.ends_at).getTime();
}
function normalizeTimestamp(value) { return value ? new Date(value).toISOString() : null; }
function findPersonName(context, streamerId) { return context.people.find(({ streamer }) => streamer.id === streamerId)?.person.name ?? streamerId; }
function findPersonNameByParticipant(context, participantId) { return context.people.find(({ participant }) => participant.id === participantId)?.person.name ?? participantId; }
function findRecruitmentKey(context, recruitmentId) { return context.recruitments.find((row) => row.id === recruitmentId)?.recruitment_key ?? recruitmentId; }
function findOrganizationName(organizationsByName, organizationId) { return [...organizationsByName.values()].find((row) => row.id === organizationId)?.name ?? organizationId; }
function describe(row) { return Object.entries(row ?? {}).filter(([key]) => !["id", "key", "label", "source"].includes(key)).map(([key, value]) => `${key}=${value ?? "없음"}`).join(", "); }
function assertNoError(error, label) { if (error) throw new Error(`${label} 실패: ${error.message}`); }
