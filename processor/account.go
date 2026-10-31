package processor

import (
	"strings"
)

type owner struct {
	id          string
	username    string
	displayName *string
	avatarURL   *string
}

type relationship struct {
	id          string
	displayName *string
	avatarURL   *string
}

func avatarURL(userID, hash string) *string {
	if hash == "" {
		return nil
	}
	ext := "jpg"
	if strings.HasPrefix(hash, "a_") {
		ext = "gif"
	}
	return strPtr("https://cdn.discordapp.com/avatars/" + userID + "/" + hash + "." + ext)
}

// optionalString reads a key the reference takes with `.get()`: present is
// false when it is absent or null, ok is false when it holds anything but a
// string.
func optionalString(m members, key string) (s string, present bool, ok bool) {
	v, has := m.get(key)
	if !has || kindOf(v) == kindNull {
		return "", false, true
	}
	s, ok = decodeString(v)
	return s, ok, ok
}

// orDisplayName mirrors `a.get('display_name') or b.get('global_name')`: the
// first value when it is a non-empty string, else the second one as is.
func orDisplayName(first members, second members, path string, iss *issues) *string {
	if s, present, ok := optionalString(first, "display_name"); !ok {
		iss.add(path, "", "display_name", ProblemWrongType, 1)
	} else if present && s != "" {
		return strPtr(s)
	}
	s, present, ok := optionalString(second, "global_name")
	if !ok {
		iss.add(path, "", "global_name", ProblemWrongType, 1)
		return nil
	}
	if !present {
		return nil
	}
	return strPtr(s)
}

func requiredString(m members, key, path, field string, iss *issues) (string, bool) {
	v, has := m.get(key)
	if !has {
		iss.add(path, "", field, ProblemMissing, 1)
		return "", false
	}
	switch kindOf(v) {
	case kindString:
		s, _ := decodeString(v)
		return s, true
	case kindNull:
		iss.add(path, "", field, ProblemNull, 1)
	default:
		iss.add(path, "", field, ProblemWrongType, 1)
	}
	return "", false
}

func readOwner(data []byte, path string, iss *issues) (owner, []relationship) {
	var o owner
	m, err := parseObject(data)
	if err != nil {
		iss.add(path, "", "", problemOf(err), 1)
		return o, nil
	}
	o.id, _ = requiredString(m, "id", path, "id", iss)
	o.username, _ = requiredString(m, "username", path, "username", iss)
	// The reference reads `email` without using it, so only its absence is
	// reported.
	if _, has := m.get("email"); !has {
		iss.add(path, "", "email", ProblemMissing, 1)
	}
	if v, has := m.get("avatar_hash"); !has {
		iss.add(path, "", "avatar_hash", ProblemMissing, 1)
	} else if hash, ok := avatarHash(v); ok {
		o.avatarURL = avatarURL(o.id, hash)
	} else {
		iss.add(path, "", "avatar_hash", ProblemWrongType, 1)
	}
	o.displayName = orDisplayName(m, m, path, iss)

	rels, has := m.get("relationships")
	if !has {
		iss.add(path, "", "relationships", ProblemMissing, 1)
		return o, nil
	}
	if kindOf(rels) != kindArray {
		iss.add(path, "", "relationships", ProblemWrongType, 1)
		return o, nil
	}
	var out []relationship
	_ = eachElement(rels, func(v []byte) bool {
		r, ok := readRelationship(v, path, iss)
		if ok {
			out = append(out, r)
		}
		return true
	})
	return o, out
}

func readRelationship(v []byte, path string, iss *issues) (relationship, bool) {
	const field = "relationships[]"
	var r relationship
	if kindOf(v) != kindObject {
		iss.add(path, "", field, ProblemWrongType, 1)
		return r, false
	}
	m, err := objectMembers(v)
	if err != nil {
		iss.add(path, "", field, ProblemMalformed, 1)
		return r, false
	}
	id, ok := requiredString(m, "id", path, field+".id", iss)
	if !ok {
		return r, false
	}
	r.id = id
	uv, has := m.get("user")
	if !has {
		iss.add(path, "", field+".user", ProblemMissing, 1)
		return r, false
	}
	if kindOf(uv) != kindObject {
		iss.add(path, "", field+".user", ProblemWrongType, 1)
		return r, false
	}
	u, err := objectMembers(uv)
	if err != nil {
		iss.add(path, "", field+".user", ProblemMalformed, 1)
		return r, false
	}
	// Read and unused, like the owner's `email`.
	if _, has := u.get("username"); !has {
		iss.add(path, "", field+".user.username", ProblemMissing, 1)
	}
	if av, has := u.get("avatar"); !has {
		iss.add(path, "", field+".user.avatar", ProblemMissing, 1)
	} else if hash, ok := avatarHash(av); ok {
		r.avatarURL = avatarURL(id, hash)
	} else {
		iss.add(path, "", field+".user.avatar", ProblemWrongType, 1)
	}
	r.displayName = orDisplayName(m, u, path, iss)
	return r, true
}

// avatarHash reads an avatar hash: null and "" mean no avatar, any other
// non-string fails in the reference.
func avatarHash(v []byte) (string, bool) {
	switch kindOf(v) {
	case kindNull:
		return "", true
	case kindString:
		return decodeString(v)
	case kindBool:
		if string(v) == "false" {
			return "", true
		}
	}
	return "", false
}

// readPayments keeps the successful payments that weren't settled in Orbs.
func readPayments(data []byte, path string, iss *issues) []Payment {
	m, err := parseObject(data)
	if err != nil {
		iss.add(path, "", "", problemOf(err), 1)
		return nil
	}
	records, has := m.get("records")
	if !has {
		return nil
	}
	if kindOf(records) != kindArray {
		iss.add(path, "", "records", ProblemWrongType, 1)
		return nil
	}
	var out []Payment
	_ = eachElement(records, func(v []byte) bool {
		if p, ok := readPayment(v, path, iss); ok {
			out = append(out, p)
		}
		return true
	})
	return out
}

func readPayment(v []byte, path string, iss *issues) (Payment, bool) {
	const field = "records[]"
	var p Payment
	if kindOf(v) != kindObject {
		iss.add(path, "", field, ProblemWrongType, 1)
		return p, false
	}
	m, err := objectMembers(v)
	if err != nil {
		iss.add(path, "", field, ProblemMalformed, 1)
		return p, false
	}
	// `payment.get('status') != 1` compares with Python equality, which also
	// holds for 1.0 and true.
	status, _ := m.get("status")
	switch kindOf(status) {
	case kindNumber:
		if n, ok := decodeNumber(status); !ok || !(n.isInt && n.i == 1 || !n.isInt && n.f == 1) {
			return p, false
		}
	case kindBool:
		if string(status) != "true" {
			return p, false
		}
	default:
		return p, false
	}
	if cur, has := m.get("currency"); has && kindOf(cur) == kindString {
		if s, _ := decodeString(cur); s == "discord_orb" {
			return p, false
		}
	}

	ok := true
	text := func(key string) *string {
		v, has := m.get(key)
		if !has {
			iss.add(path, "", field+"."+key, ProblemMissing, 1)
			ok = false
			return nil
		}
		switch kindOf(v) {
		case kindString:
			s, _ := decodeString(v)
			return &s
		case kindNull:
			return nil
		case kindNumber:
			if n, _ := decodeNumber(v); n.isInt {
				return strPtr(itoa(n.i))
			}
		}
		iss.add(path, "", field+"."+key, ProblemWrongType, 1)
		ok = false
		return nil
	}
	p.PaymentID = text("id")
	p.Currency = text("currency")
	p.Description = text("description")

	switch amount, has := m.get("amount"); {
	case !has:
		iss.add(path, "", field+".amount", ProblemMissing, 1)
		ok = false
	case kindOf(amount) == kindNumber:
		n, valid := decodeNumber(amount)
		if !valid {
			iss.add(path, "", field+".amount", ProblemWrongType, 1)
			ok = false
		} else if n.isInt {
			p.Amount = n.i
		} else {
			p.Amount = n.f
		}
	case kindOf(amount) == kindString:
		s, _ := decodeString(amount)
		p.Amount = s
	case kindOf(amount) == kindNull:
		p.Amount = nil
	default:
		iss.add(path, "", field+".amount", ProblemWrongType, 1)
		ok = false
	}

	created, has := m.get("created_at")
	if !has {
		iss.add(path, "", field+".created_at", ProblemMissing, 1)
		return p, false
	}
	s, isStr := decodeString(created)
	if !isStr {
		iss.add(path, "", field+".created_at", ProblemWrongType, 1)
		return p, false
	}
	ts, valid := pyTimestamp(s, 0)
	if !valid {
		iss.add(path, "", field+".created_at", ProblemUnparseable, 1)
		return p, false
	}
	p.PaymentDate = dayString(floorDiv(ts, secondsPerDay))
	return p, ok
}
