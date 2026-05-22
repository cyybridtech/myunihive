/**
 * Roommate Matching API Handlers
 * GET /api/roommate/profile - Get current user profile
 * POST /api/roommate/profile - Save or update user roommate matching profile
 * GET /api/roommate/matches - Get compatibility matches for current user
 */

const { getPool } = require('./config');

async function roommateHandler(req, res) {
    const method = req.method || req.httpMethod;

    if (method === 'POST') {
        return saveProfile(req, res);
    } else if (method === 'GET') {
        const path = req.path || req.url || '';
        if (path.includes('matches')) {
            return getMatches(req, res);
        }
        return getProfile(req, res);
    }

    res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

async function getProfile(req, res) {
    const user_id = req.user_id;
    if (!user_id) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    const pool = getPool();
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM roommate_profiles WHERE user_id = ?',
            [user_id]
        );

        if (rows.length === 0) {
            return res.json({ status: 'success', profile: null });
        }

        res.json({ status: 'success', profile: rows[0] });
    } catch (e) {
        console.error('Get roommate profile error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to retrieve roommate profile' });
    }
}

async function saveProfile(req, res) {
    const user_id = req.user_id;
    if (!user_id) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    const { sleep_habit, study_habit, cleanliness, social_level, bio, contact_info } = req.body || {};

    if (!sleep_habit || !study_habit || !cleanliness || !social_level) {
        return res.status(400).json({ status: 'error', message: 'Matching choices are required' });
    }

    const pool = getPool();
    try {
        // Insert or Update profile on duplicate key
        await pool.execute(
            `INSERT INTO roommate_profiles (user_id, sleep_habit, study_habit, cleanliness, social_level, bio, contact_info)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                sleep_habit = VALUES(sleep_habit),
                study_habit = VALUES(study_habit),
                cleanliness = VALUES(cleanliness),
                social_level = VALUES(social_level),
                bio = VALUES(bio),
                contact_info = VALUES(contact_info)`,
            [user_id, sleep_habit, study_habit, cleanliness, social_level, bio || null, contact_info || null]
        );

        res.json({ status: 'success', message: 'Profile saved successfully' });
    } catch (e) {
        console.error('Save roommate profile error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to save profile' });
    }
}

async function getMatches(req, res) {
    const user_id = req.user_id;
    if (!user_id) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    const pool = getPool();
    try {
        // 1. Get current user's profile and university_id
        const [userRows] = await pool.execute(
            `SELECT p.*, u.university_id, u.gender as user_gender
             FROM users u
             LEFT JOIN roommate_profiles p ON u.id = p.user_id
             WHERE u.id = ?`,
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const userProfile = userRows[0];
        const userUniversityId = userProfile.university_id;

        if (!userProfile.sleep_habit) {
            // User hasn't created a profile yet
            return res.json({ status: 'success', setupRequired: true, matches: [] });
        }

        // 2. Fetch all other roommate profiles at the same university
        const [otherProfiles] = await pool.execute(
            `SELECT p.*, u.full_name, u.avatar, u.email, u.phone, u.role, uni.name as university_name
             FROM roommate_profiles p
             JOIN users u ON p.user_id = u.id
             LEFT JOIN universities uni ON u.university_id = uni.id
             WHERE u.id != ? AND u.university_id = ? AND u.role = 'student'`,
            [user_id, userUniversityId]
        );

        // 3. Compute dynamic compatibility percentage
        const matches = otherProfiles.map(other => {
            let matchesCount = 0;
            const details = [];

            if (other.sleep_habit === userProfile.sleep_habit) {
                matchesCount++;
                details.push('Sleep Schedule');
            }
            if (other.study_habit === userProfile.study_habit) {
                matchesCount++;
                details.push('Study Noise');
            }
            if (other.cleanliness === userProfile.cleanliness) {
                matchesCount++;
                details.push('Cleanliness Level');
            }
            if (other.social_level === userProfile.social_level) {
                matchesCount++;
                details.push('Social Preference');
            }

            const score = Math.round((matchesCount / 4) * 100);

            return {
                user_id: other.user_id,
                full_name: other.full_name,
                avatar: other.avatar || '',
                email: other.email,
                phone: other.phone || '',
                bio: other.bio || '',
                contact_info: other.contact_info || '',
                university_name: other.university_name || '',
                preferences: {
                    sleep_habit: other.sleep_habit,
                    study_habit: other.study_habit,
                    cleanliness: other.cleanliness,
                    social_level: other.social_level
                },
                score,
                matching_aspects: details
            };
        });

        // 4. Sort matches by score in descending order
        matches.sort((a, b) => b.score - a.score);

        res.json({ status: 'success', setupRequired: false, matches });
    } catch (e) {
        console.error('Get matches error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to find matches' });
    }
}

module.exports = roommateHandler;
