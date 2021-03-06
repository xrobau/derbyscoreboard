package com.carolinarollergirls.scoreboard.defaults;
/**
 * Copyright (C) 2008-2012 Mr Temper <MrTemper@CarolinaRollergirls.com>
 *
 * This file is part of the Carolina Rollergirls (CRG) ScoreBoard.
 * The CRG ScoreBoard is licensed under either the GNU General Public
 * License version 3 (or later), or the Apache License 2.0, at your option.
 * See the file COPYING for details.
 */

import java.util.*;

import java.io.*;

import java.awt.image.*;

import javax.imageio.*;

import com.carolinarollergirls.scoreboard.*;
import com.carolinarollergirls.scoreboard.xml.*;
import com.carolinarollergirls.scoreboard.event.*;
import com.carolinarollergirls.scoreboard.model.*;
import com.carolinarollergirls.scoreboard.policy.OvertimeLineupTimePolicy;

public class DefaultScoreBoardModel extends DefaultScoreBoardEventProvider implements ScoreBoardModel
{
  public DefaultScoreBoardModel() {
    reset();

    loadPolicies();

    addInPeriodListeners();

    xmlScoreBoard = new XmlScoreBoard(this);
  }

  public String getProviderName() { return "ScoreBoard"; }
  public Class getProviderClass() { return ScoreBoard.class; }
  public String getProviderId() { return ""; }

  public XmlScoreBoard getXmlScoreBoard() { return xmlScoreBoard; }

  protected void loadPolicies() {
    Enumeration keys = ScoreBoardManager.getProperties().propertyNames();

    while (keys.hasMoreElements()) {
      String key = keys.nextElement().toString();
      if (!key.startsWith(POLICY_KEY+"."))
        continue;

      String name = ScoreBoardManager.getProperty(key);

      try {
        PolicyModel policyModel = (PolicyModel)Class.forName(name).newInstance();
        addPolicyModel(policyModel);
        ScoreBoardManager.printMessage("Loaded Policy : "+name);
      } catch ( Exception e ) {
        ScoreBoardManager.printMessage("Could not load ScoreBoard policy "+name+" : " + e.getMessage());
      }
    }
  }

  public ScoreBoard getScoreBoard() { return this; }

  public void reset() {
    Iterator<ClockModel> c = getClockModels().iterator();
    while (c.hasNext())
      c.next().reset();
    Iterator<TeamModel> t = getTeamModels().iterator();
    while (t.hasNext())
      t.next().reset();
    Iterator<PolicyModel> p = getPolicyModels().iterator();
    while (p.hasNext())
      p.next().reset();

    periodClockWasRunning = false;
    jamClockWasRunning = false;
    lineupClockWasRunning = false;
    timeoutClockWasRunning = false;
    setTimeoutOwner(DEFAULT_TIMEOUT_OWNER);
    setInPeriod(false);
    setInOvertime(false);
  }

  public boolean isInPeriod() { return inPeriod; }
  public void setInPeriod(boolean p) {
    synchronized (inPeriodLock) {
      Boolean last = new Boolean(inPeriod);
      inPeriod = p;
      scoreBoardChange(new ScoreBoardEvent(this, EVENT_IN_PERIOD, new Boolean(inPeriod), last));
    }
  }
  protected void addInPeriodListeners() {
    addScoreBoardListener(new ConditionalScoreBoardListener(Clock.class, Clock.ID_PERIOD, "Running", Boolean.TRUE, periodStartListener));
    addScoreBoardListener(new ConditionalScoreBoardListener(Clock.class, Clock.ID_PERIOD, "Running", Boolean.FALSE, periodEndListener));
    addScoreBoardListener(new ConditionalScoreBoardListener(Clock.class, Clock.ID_JAM, "Running", Boolean.FALSE, periodEndListener));
  }

  public boolean isInOvertime() { return inOvertime; }
  public void setInOvertime(boolean o) {
    synchronized (inOvertimeLock) {
      Boolean last = new Boolean(inOvertime);
      inOvertime = o;
      scoreBoardChange(new ScoreBoardEvent(this, EVENT_IN_OVERTIME, new Boolean(inOvertime), last));
    }
    if (!o) {
      try {
        OvertimeLineupTimePolicy p = (OvertimeLineupTimePolicy)getPolicy(OvertimeLineupTimePolicy.ID);
        if (null != p)
          p.stopOvertime();
      } catch ( ClassCastException ccE ) {
        ScoreBoardManager.printMessage("Internal Error: invalid OvertimeLineupTimePolicy : "+ccE.getMessage());
      }
    }
  }
  public void startOvertime() {
    synchronized (runLock) {
      ClockModel pc = getClockModel(Clock.ID_PERIOD);
      ClockModel jc = getClockModel(Clock.ID_JAM);
      if (pc.isRunning() || jc.isRunning())
        return;
      if (pc.getNumber() < pc.getMaximumNumber())
        return;
      if (pc.getTime() > pc.getMinimumTime())
        return;
      pc.setTime(1000);
      setInPeriod(true);
      setInOvertime(true);
      getClockModel(Clock.ID_INTERMISSION).stop();
      try {
        OvertimeLineupTimePolicy p = (OvertimeLineupTimePolicy)getPolicy(OvertimeLineupTimePolicy.ID);
        if (null != p)
          p.startOvertime();
      } catch ( ClassCastException ccE ) {
        ScoreBoardManager.printMessage("Internal Error: invalid OvertimeLineupTimePolicy : "+ccE.getMessage());
      }
      getClockModel(Clock.ID_LINEUP).resetTime();
      getClockModel(Clock.ID_LINEUP).start();
    }
  }

  public boolean isOfficialScore() { return officialScore; }
  public void setOfficialScore(boolean o) {
    synchronized (officialScoreLock) {
      Boolean last = new Boolean(officialScore);
      officialScore = o;
      scoreBoardChange(new ScoreBoardEvent(this, EVENT_OFFICIAL_SCORE, new Boolean(officialScore), last));
    }
  }

  public void startJam() {
    synchronized (runLock) {
      if (!getClock(Clock.ID_JAM).isRunning()) {
        ClockModel pc = getClockModel(Clock.ID_PERIOD);
        ClockModel jc = getClockModel(Clock.ID_JAM);
        ClockModel tc = getClockModel(Clock.ID_TIMEOUT);
        lineupClockWasRunning = getClockModel(Clock.ID_LINEUP).isRunning();

//FIXME - change to policies
        // If Period Clock is at end, increment number and reset time
        if (pc.getTime() == (pc.isCountDirectionDown() ? pc.getMinimumTime() : pc.getMaximumTime())) {
          pc.changeNumber(1);
          pc.resetTime();
        }
        periodClockWasRunning = pc.isRunning();
        pc.start();

        // If Jam Clock is not at start (2:00), increment number and reset time
        if (jc.getTime() != (jc.isCountDirectionDown() ? jc.getMaximumTime() : jc.getMinimumTime()))
          jc.changeNumber(1);
        jc.resetTime();
        jc.start();

        timeoutClockWasRunning = tc.isRunning();
        tc.stop();
      }
    }
  }
  public void stopJam() {
    synchronized (runLock) {
      if (getClockModel(Clock.ID_JAM).isRunning()) {
        getClockModel(Clock.ID_JAM).stop();
      }
    }
  }

  public void timeout() { timeout(null); }
  public void timeout(TeamModel team) {
    synchronized (runLock) {
      setTimeoutOwner(null==team?"":team.getId());
      if (!getClockModel(Clock.ID_TIMEOUT).isRunning()) {
//FIXME - change to policy?
        getClockModel(Clock.ID_PERIOD).stop();
        jamClockWasRunning = getClockModel(Clock.ID_JAM).isRunning();
        lineupClockWasRunning = getClockModel(Clock.ID_LINEUP).isRunning();
        getClockModel(Clock.ID_JAM).stop();
        getClockModel(Clock.ID_TIMEOUT).resetTime();
        getClockModel(Clock.ID_TIMEOUT).start();
      }
    }
  }

  public void unStartJam() {
    synchronized (runLock) {
      if (!getClock(Clock.ID_JAM).isRunning())
        return;

      if (lineupClockWasRunning)
        getClockModel(Clock.ID_LINEUP).unstop();
      if (timeoutClockWasRunning)
        getClockModel(Clock.ID_TIMEOUT).unstop();
      if (!periodClockWasRunning)
        getClockModel(Clock.ID_PERIOD).unstart();
      getClockModel(Clock.ID_JAM).unstart();
    }
  }
  public void unStopJam() {
    synchronized (runLock) {
      if (getClock(Clock.ID_JAM).isRunning())
        return;

      getClockModel(Clock.ID_LINEUP).stop();
      getClockModel(Clock.ID_JAM).unstop();
    }
  }
  public void unTimeout() {
    synchronized (runLock) {
      if (!getClock(Clock.ID_TIMEOUT).isRunning())
        return;

      if (lineupClockWasRunning)
        getClockModel(Clock.ID_LINEUP).unstop();
      if (jamClockWasRunning)
        getClockModel(Clock.ID_JAM).unstop();
      getClockModel(Clock.ID_PERIOD).unstop();
      getClockModel(Clock.ID_TIMEOUT).unstart();
    }
  }

  public List<ClockModel> getClockModels() { return new ArrayList<ClockModel>(clocks.values()); }
  public List<TeamModel> getTeamModels() { return new ArrayList<TeamModel>(teams.values()); }
  public List<PolicyModel> getPolicyModels() { return new ArrayList<PolicyModel>(policies.values()); }

  public List<Clock> getClocks() { return new ArrayList<Clock>(getClockModels()); }
  public List<Team> getTeams() { return new ArrayList<Team>(getTeamModels()); }
  public List<Policy> getPolicies() { return new ArrayList<Policy>(getPolicyModels()); }

  public Clock getClock(String id) { return getClockModel(id).getClock(); }
  public Team getTeam(String id) { return getTeamModel(id).getTeam(); }
  public Policy getPolicy(String id) { try { return getPolicyModel(id).getPolicy(); } catch ( NullPointerException npE ) { return null; } }

  public ClockModel getClockModel(String id) {
    synchronized (clocks) {
// FIXME - don't auto-create!  return null instead - or throw exception.  Need to update all callers to handle first.
      if (!clocks.containsKey(id))
        createClockModel(id);

      return clocks.get(id);
    }
  }

  public TeamModel getTeamModel(String id) {
    synchronized (teams) {
// FIXME - don't auto-create!  return null instead - or throw exception.  Need to update all callers to handle first.
      if (!teams.containsKey(id))
        createTeamModel(id);

      return teams.get(id);
    }
  }

  public PolicyModel getPolicyModel(String id) {
    synchronized (policies) {
      return policies.get(id);
    }
  }
  public void addPolicyModel(PolicyModel model) throws IllegalArgumentException {
    if ((model.getId() == null) || (model.getId().equals("")))
      throw new IllegalArgumentException("PolicyModel has null or empty Id");

    try {
      model.setScoreBoardModel(this);
    } catch ( Exception e ) {
      e.printStackTrace();
      throw new IllegalArgumentException("Exception while setting ScoreBoardModel on PolicyModel : "+e.getMessage());
    }

    synchronized (policies) {
      policies.put(model.getId(), model);
      model.addScoreBoardListener(this);
      scoreBoardChange(new ScoreBoardEvent(this, EVENT_ADD_POLICY, model, null));
    }
  }
  public void removePolicyModel(PolicyModel model) {
    synchronized (policies) {
      policies.remove(model.getId());
      model.removeScoreBoardListener(this);
      scoreBoardChange(new ScoreBoardEvent(this, EVENT_REMOVE_POLICY, model, null));
    }
  }

  public String getTimeoutOwner() { return timeoutOwner; }
  public void setTimeoutOwner(String owner) {
    synchronized (timeoutOwnerLock) {
      String last = timeoutOwner;
      timeoutOwner = owner;
      scoreBoardChange(new ScoreBoardEvent(this, EVENT_TIMEOUT_OWNER, timeoutOwner, last));
    }
  }

  protected void createClockModel(String id) {
    if ((id == null) || (id.equals("")))
      return;

    ClockModel model = new DefaultClockModel(this, id);
    model.addScoreBoardListener(this);
    clocks.put(id, model);
    scoreBoardChange(new ScoreBoardEvent(this, EVENT_ADD_CLOCK, model, null));
  }

  protected void createTeamModel(String id) {
    if ((id == null) || (id.equals("")))
      return;

    TeamModel model = new DefaultTeamModel(this, id);
    model.addScoreBoardListener(this);
    teams.put(id, model);
    scoreBoardChange(new ScoreBoardEvent(this, EVENT_ADD_TEAM, model, null));
  }

  protected HashMap<String,ClockModel> clocks = new HashMap<String,ClockModel>();
  protected HashMap<String,TeamModel> teams = new HashMap<String,TeamModel>();
  protected HashMap<String,PolicyModel> policies = new HashMap<String,PolicyModel>();

  protected Object runLock = new Object();

  protected String timeoutOwner;
  protected Object timeoutOwnerLock = new Object();

  protected boolean inPeriod = false;
  protected Object inPeriodLock = new Object();

  protected boolean inOvertime = false;
  protected Object inOvertimeLock = new Object();

  protected boolean officialScore = false;
  protected Object officialScoreLock = new Object();

  protected boolean periodClockWasRunning = false;
  protected boolean jamClockWasRunning = false;
  protected boolean lineupClockWasRunning = false;
  protected boolean timeoutClockWasRunning = false;

  protected XmlScoreBoard xmlScoreBoard;

  protected ScoreBoardListener periodStartListener = new ScoreBoardListener() {
      public void scoreBoardChange(ScoreBoardEvent event) {
        if (!isInPeriod())
          setInPeriod(true);
      }
    };
  protected ScoreBoardListener periodEndListener = new ScoreBoardListener() {
      public void scoreBoardChange(ScoreBoardEvent event) {
        Clock p = getClock(Clock.ID_PERIOD);
        Clock j = getClock(Clock.ID_JAM);
        if (isInPeriod() && !p.isRunning() && (p.getTime() == p.getMinimumTime()) && !j.isRunning())
          setInPeriod(false);
      }
    };

  public static final String DEFAULT_TIMEOUT_OWNER = "";

  public static final String POLICY_KEY = DefaultScoreBoardModel.class.getName() + ".policy";
}

