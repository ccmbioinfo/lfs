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

package ca.sickkids.ccm.lfs.cardiacrehab.internal.export;

import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.commons.scheduler.ScheduleOptions;
import org.apache.sling.commons.scheduler.Scheduler;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(immediate = true)
public class NightlyExport
{
    /** Default log. */
    private static final Logger LOGGER = LoggerFactory.getLogger(NightlyExport.class);

    /** Provides access to resources. */
    @Reference
    private ResourceResolverFactory resolverFactory;

    /** The scheduler for rescheduling jobs. */
    @Reference
    private Scheduler scheduler;

    @Activate
    protected void activate(ComponentContext componentContext) throws Exception
    {
        LOGGER.info("NightlyExport activating");
        final String nightlyExportSchedule = System.getenv("NIGHTLY_EXPORT_SCHEDULE");
        ScheduleOptions options = this.scheduler.EXPR(nightlyExportSchedule);
        options.name("NightlyExport");
        options.canRunConcurrently(true);

        final Runnable exportJob = new ExportTask(this.resolverFactory);

        try {
            this.scheduler.schedule(exportJob, options);
        } catch (Exception e) {
            LOGGER.error("NightlyExport Failed to schedule: {}", e.getMessage(), e);
        }
    }
}
