import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    typeof teamId !== 'string' ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('userId and teamId must be valid IDs'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('The referenced user or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }

  if (members !== undefined && !Array.isArray(members)) {
    throw Object.assign(new Error('Team members must be an array of user IDs'), { status: 400 });
  }
  const memberIds = (members ?? []) as unknown[];
  if (memberIds.some((memberId) => typeof memberId !== 'string' || !mongoose.Types.ObjectId.isValid(memberId))) {
    throw Object.assign(new Error('Team members must contain valid user IDs'), { status: 400 });
  }

  const uniqueMemberIds = [...new Set(memberIds as string[])];
  if (uniqueMemberIds.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
    if (memberCount !== uniqueMemberIds.length) {
      throw Object.assign(new Error('One or more team members do not exist'), { status: 404 });
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMemberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: pointsByTeam.get(_id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const activityTypes = activities.map(({ type }) => type.toLowerCase());
  const enduranceActivityTypes = new Set(['run', 'running', 'cycle', 'cycling', 'bike', 'biking', 'swim', 'swimming']);

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const goalMatches = goal.includes(focus) || focus.includes(goal);
      const matchingActivityType = activityTypes.find((type) =>
        type === focus || (focus === 'endurance' && enduranceActivityTypes.has(type)),
      );
      const activityMatches = matchingActivityType !== undefined;
      const score = (goalMatches ? 2 : 0) + (activityMatches ? 1 : 0);
      const reasons = [
        goalMatches ? `matches your ${user.fitnessGoal} fitness goal` : undefined,
        matchingActivityType ? `fits your recent ${matchingActivityType} activity` : undefined,
      ].filter((reason): reason is string => reason !== undefined);
      return {
        ...workout,
        score,
        reason: reasons.length > 0
          ? `Recommended because it ${reasons.join(' and ')}.`
          : `Suggested to help broaden your training beyond your ${user.fitnessGoal} goal and recent activity.`,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
