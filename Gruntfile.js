module.exports = function(grunt){

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        banner: '// <%= pkg.name %> Version <%= pkg.version %> \n' +
                '// Last built <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '// Distributed Under MIT License\n' +
                '// (c) 2013 Bart Wood \n\n',

        // This file set is pretty small, I don't need anything fancy for dependencies like requireJS - especially if
        // it forces people to include yet another library just to use Kojak.
        // The order here is important. Don't change it.
        sourceFiles: [
            'src/contains_shim.js',
            'src/Core.js',
            'src/Config.js',
            'src/Formatter.js',
            'src/FunctionProfile.js',
            'src/Instrumentor.js',
            'src/NetProfile.js',
            'src/NetProfileCall.js',
            'src/NetWatcher.js',
            'src/Report.js',
            'src/Start.js'
        ],

        jasmine: {
            core: {
                src: 'src/Core.js',
                options: {
                    specs: 'spec/unit/CoreSpec.js'
                }
            },
            config: {
                src: ['src/Core.js', 'src/Config.js'],
                options: {
                    specs: 'spec/unit/ConfigSpec.js'
                }
            },
            functionProfile: {
                src: ['src/Core.js', 'src/FunctionProfile.js'],
                options: {
                    specs: 'spec/unit/FunctionProfileSpec.js'
                }
            },
            instrumentBasic: {
                src: ['src/contains_shim.js', 'src/Core.js', 'src/Config.js', 'src/FunctionProfile.js', 'src/Instrumentor.js'],
                options: {
                    specs: 'spec/integration/InstrumentBasicSpec.js'
                }
            }
        },

        watch: {
            scripts: {
                files: ['<%= sourceFiles %>', 'spec/unit/**Spec.js', 'spec/integration/**Spec.js'],
                tasks: ['buildDev'],
                options: {
                    spawn: false
                }
            }
        },

        jshint: {
            beforeconcat: '<%= sourceFiles %>'
        },

        concat: {
            options: {
                stripBanners: true,
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= sourceFiles %>',
                dest: '<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            build: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s). (also grunt watch)
    grunt.registerTask('buildDev', ['jshint', 'jasmine', 'concat']);
    grunt.registerTask('buildProd', ['jshint', 'jasmine', 'concat', 'uglify']);

};