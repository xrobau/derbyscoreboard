package com.carolinarollergirls.scoreboard.xml;
/**
 * Copyright (C) 2008-2012 Mr Temper <MrTemper@CarolinaRollergirls.com>
 *
 * This file is part of the Carolina Rollergirls (CRG) ScoreBoard.
 * The CRG ScoreBoard is licensed under either the GNU General Public
 * License version 3 (or later), or the Apache License 2.0, at your option.
 * See the file COPYING for details.
 */

import java.util.*;

import org.jdom.*;

import com.carolinarollergirls.scoreboard.*;
import com.carolinarollergirls.scoreboard.model.*;

public class XmlScoreBoardListenerFilter implements XmlScoreBoardListener
{
  public XmlScoreBoardListenerFilter(XmlScoreBoardListener l) { listener = l; }

  public void xmlChange(Document d) { listener.xmlChange(d); }

  protected XmlScoreBoardListener getListener() { return listener; }

  protected XmlScoreBoardListener listener;
}
