-- Aggregate-only validation queries for staging and internal sanity checks.
-- These queries are meant for operators and developers. They intentionally avoid returning
-- raw user rows in the reporting output.

-- 1. Top bases by monthly inbound demand.
select
  public.base_catalog.installation_name,
  aggregates.base_demand_monthly.destination_base_id,
  aggregates.base_demand_monthly.move_month,
  aggregates.base_demand_monthly.total_moves,
  aggregates.base_demand_monthly.pct_change_vs_prior_period,
  aggregates.base_demand_monthly.rolling_avg,
  aggregates.base_demand_monthly.updated_at
from aggregates.base_demand_monthly
left join public.base_catalog
  on public.base_catalog.id = aggregates.base_demand_monthly.destination_base_id
order by
  aggregates.base_demand_monthly.total_moves desc,
  aggregates.base_demand_monthly.move_month desc,
  public.base_catalog.installation_name asc;

-- 2. Service interest by base.
select
  public.base_catalog.installation_name,
  aggregates.service_interest_by_base.base_id,
  aggregates.service_interest_by_base.service_category,
  aggregates.service_interest_by_base.interest_count,
  aggregates.service_interest_by_base.interest_rate,
  aggregates.service_interest_by_base.time_window
from aggregates.service_interest_by_base
left join public.base_catalog
  on public.base_catalog.id = aggregates.service_interest_by_base.base_id
order by
  public.base_catalog.installation_name asc,
  aggregates.service_interest_by_base.interest_count desc,
  aggregates.service_interest_by_base.service_category asc;

-- 3. Top clicked resource categories without exposing click rows.
select
  public.resource_clicks.category,
  count(*)::bigint as click_count,
  count(*) filter (where public.resource_clicks.partner_id is not null)::bigint as partner_click_count,
  count(*) filter (where public.resource_clicks.partner_id is null)::bigint as official_click_count,
  min(public.resource_clicks.clicked_at) as first_click_at,
  max(public.resource_clicks.clicked_at) as last_click_at
from public.resource_clicks
where public.resource_clicks.category is not null
group by public.resource_clicks.category
order by click_count desc, public.resource_clicks.category asc;

-- 4. Referral clicks and explicit-lead conversion by partner.
select
  public.partners.display_name,
  public.partners.partner_category,
  aggregates.referral_conversion_by_partner.referral_clicks,
  aggregates.referral_conversion_by_partner.lead_submissions,
  aggregates.referral_conversion_by_partner.conversion_rate,
  aggregates.referral_conversion_by_partner.time_window
from aggregates.referral_conversion_by_partner
join public.partners
  on public.partners.id = aggregates.referral_conversion_by_partner.partner_id
order by
  aggregates.referral_conversion_by_partner.referral_clicks desc,
  public.partners.display_name asc;

-- 5. Explicit partner lead requests by partner and lead status.
select
  public.partners.display_name,
  public.partners.partner_category,
  public.partner_leads.status,
  count(*)::bigint as lead_count,
  min(public.partner_leads.created_at) as first_lead_at,
  max(public.partner_leads.created_at) as last_lead_at
from public.partner_leads
join public.partners
  on public.partners.id = public.partner_leads.partner_id
group by
  public.partners.display_name,
  public.partners.partner_category,
  public.partner_leads.status
order by
  public.partners.display_name asc,
  public.partner_leads.status asc;

-- 6. Housing and lodging demand signals by installation.
select
  public.base_catalog.installation_name,
  housing.base_id,
  housing.on_base_interest_count,
  housing.off_base_interest_count,
  housing.rent_interest_count,
  housing.buy_interest_count,
  lodging.move_month,
  lodging.lodging_need_count,
  lodging.lodging_need_rate
from aggregates.housing_interest_by_installation as housing
left join aggregates.temporary_lodging_demand_by_base as lodging
  on lodging.base_id = housing.base_id
left join public.base_catalog
  on public.base_catalog.id = housing.base_id
order by
  public.base_catalog.installation_name asc,
  lodging.move_month asc nulls last;

-- 7. Content engagement by move stage.
select
  aggregates.content_engagement_by_move_stage.move_stage,
  aggregates.content_engagement_by_move_stage.content_category,
  aggregates.content_engagement_by_move_stage.engagement_count,
  aggregates.content_engagement_by_move_stage.ctr_or_engagement_rate,
  aggregates.content_engagement_by_move_stage.time_window
from aggregates.content_engagement_by_move_stage
order by
  aggregates.content_engagement_by_move_stage.move_stage asc,
  aggregates.content_engagement_by_move_stage.engagement_count desc,
  aggregates.content_engagement_by_move_stage.content_category asc;

-- 8. First-week need mix by installation.
select
  public.base_catalog.installation_name,
  aggregates.arrival_week_needs_summary.base_id,
  aggregates.arrival_week_needs_summary.need_category,
  aggregates.arrival_week_needs_summary.count,
  aggregates.arrival_week_needs_summary.rate,
  aggregates.arrival_week_needs_summary.reporting_window
from aggregates.arrival_week_needs_summary
left join public.base_catalog
  on public.base_catalog.id = aggregates.arrival_week_needs_summary.base_id
order by
  public.base_catalog.installation_name asc,
  aggregates.arrival_week_needs_summary.count desc,
  aggregates.arrival_week_needs_summary.need_category asc;

-- 9. School-interest and family-need trend signal by installation.
select
  public.base_catalog.installation_name,
  aggregates.school_search_trends_by_installation.base_id,
  aggregates.school_search_trends_by_installation.move_month,
  aggregates.school_search_trends_by_installation.school_interest_count,
  aggregates.school_search_trends_by_installation.school_interest_rate,
  aggregates.school_search_trends_by_installation.trend_delta
from aggregates.school_search_trends_by_installation
left join public.base_catalog
  on public.base_catalog.id = aggregates.school_search_trends_by_installation.base_id
order by
  public.base_catalog.installation_name asc,
  aggregates.school_search_trends_by_installation.move_month asc;
