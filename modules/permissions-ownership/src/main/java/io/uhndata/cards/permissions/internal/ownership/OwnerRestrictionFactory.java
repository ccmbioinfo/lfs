/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package io.uhndata.cards.permissions.internal.ownership;

import javax.jcr.Session;

import org.apache.jackrabbit.oak.api.PropertyState;
import org.apache.jackrabbit.oak.api.Type;
import org.apache.jackrabbit.oak.spi.security.authorization.restriction.RestrictionPattern;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.FieldOption;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicyOption;

import io.uhndata.cards.permissions.spi.RestrictionFactory;

/**
 * Factory for {@link OwnerRestrictionPattern}.
 *
 * @version $Id$
 */
@Component(immediate = true)
public class OwnerRestrictionFactory implements RestrictionFactory
{
    /** @see #getName */
    public static final String NAME = "cards:owner";

    /**
     * This is needed to get access to the current session, which knows the currently logged in user. The reference
     * configuration is set to lazily resolve the service, since the RRF is only available after the repository is
     * initialized, but the repository initialization scripts reference the owner restriction, which would lead to a
     * circular dependency. By allowing the RRF to be null when this class is instantiated, the repoinit statements can
     * be processed correctly, and the RRF is only needed when actually evaluating permissions, which only happens when
     * the repository is ready.
     */
    @Reference(fieldOption = FieldOption.REPLACE,
        cardinality = ReferenceCardinality.OPTIONAL,
        policyOption = ReferencePolicyOption.GREEDY)
    private ResourceResolverFactory rrf;

    @Override
    public RestrictionPattern forValue(PropertyState value)
    {
        // The value is ignored, the owner is set in the Form node itself
        Session session = null;
        if (this.rrf != null && this.rrf.getThreadResourceResolver() != null) {
            session = this.rrf.getThreadResourceResolver().adaptTo(Session.class);
        }
        return new OwnerRestrictionPattern(session);
    }

    @Override
    public String getName()
    {
        return NAME;
    }

    @Override
    public Type<?> getType()
    {
        // This doesn't actually support any type, since it is only a marker restriction. However, specifying a type is
        // mandatory, and a single-value type enforces that a single value is provided, while a multi-value type happily
        // accepts no value at all.
        return Type.STRINGS;
    }
}
