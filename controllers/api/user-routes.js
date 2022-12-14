const router = require('express').Router();
const {User, Journal, Comment} = require('../../models');
const withAuth = require('../../utils/auth');

router.get('/', (req, res) =>
{
    User.findAll({attributes:{exclude: ['password']}})
        .then(dbUserData => res.json(dbUserData))
        .catch(err =>
        {
            console.log(err);
            res.status(500).json(err);
        });
});

router.get('/:id', (req, res) =>
{
    User.findOne
    ({
        attributes: {exclude: ['password']},
        where: {id: req.params.id},
        include:
        [
            {
                model: Journal,
                attributes: ['id', 'user_id', 'title', 'updated_at']
            },
            {
                model: Comment,
                attributes: ['id', 'comment_text', 'post_id', 'user_id', 'created_at'],
                include:
                {
                    model: Journal,
                    attributes: ['title']
                }
            }
        ]
    })
    .then(dbUserData =>
    {
        if (!dbUserData)
        {
            res.status(404).json({message: `No user exists with the given parameters.`});
            return;
        }
        res.json(dbUserData);
    })
    .catch(err =>
    {
        console.log(err);
        res.status(500).json(err);
    })
});

router.post('/', withAuth, (req, res) =>
{
    User.create
    ({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })
    .then(dbUserData =>
    {
        req.session.save(() =>
        {
            req.session.user_id = dbUserData.id;
            req.session.username = dbUserData.username;
            req.session.loggedIN = true;
            res.json(dbUserData);
        })
    })
    .catch(err =>
    {
        console.log(err);
        res.status(500).json(err);
    });
});

router.post('/login', (req, res) =>
{
    User.findOne
    ({
        where: {email: req.body.email}
    })
    .then(dbUserData =>
    {
        if (!dbUserData)
        {
            res.status(400).json({message: `No user found with that email.`});
            return;
        }

        const validPW = dbUserData.checkPassword(req.body.password);
        if (!validPW)
        {
            res.status(400).json({message: `Incorrect password.`});
            return;
        }
        req.session.save(() =>
        {
            req.session.user_id = dbUserData.id;
            req.session.username = dbUserData.username;
            req.session.loggedIN = true;
            res.json({user: dbUserData, message: `Welcome to Journify!`});
        });
    });
});

router.post('/logout', (req, res) =>
{
    if (req.session.loggedIN)
    {
        req.session.destroy(() =>
        {
            res.status(204).end();
        });
    }
    else
    {
        res.status(404).end();
    }
});

router.put('/:id', withAuth, (req, res) =>
{
    User.update(req.body,
    {
        individualHooks: true,
        where: {id: req.params.id}
    })
    .then(dbUserData =>
    {
        if (!dbUserData[0])
        {
            res.status(404).json({message: `No user exists with the given parameters.`});
            return;
        }
        res.json(dbUserData);
    })
    .catch(err =>
    {
        console.log(err);
        res.status(500).json(err);
    });
});

router.delete('/:id', withAuth, (req, res) =>
{
    User.destroy({where: {id: req.params.id}})
    .then(dbUserData =>
    {
        if (!dbUserData[0])
        {
            res.status(404).json({message: `No user exists with the given parameters.`});
            return;
        }
        res.json(dbUserData);
    })
    .catch(err =>
    {
        console.log(err);
        res.status(500).json(err);
    });
});

module.exports = router;